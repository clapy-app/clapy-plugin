import type { RulePlain } from 'css-tree';
import { relative } from 'path';
import type { Statement } from 'typescript';
import ts from 'typescript';

import type { Nil } from '../../common/general-utils.js';
import { isNonEmptyObject } from '../../common/general-utils.js';
import { flags } from '../../env-and-config/app-config.js';
import { warnOrThrow } from '../../utils.js';
import type { Dict } from '../sb-serialize-preview/sb-serialize.model.js';
import { genNodeAst, prepareNode } from './4-gen-node.js';
import type { JsxOneOrMore, ModuleContext, NodeContext, ParentNode, ProjectContext } from './code.model.js';
import type { ComponentNode2, RulePlainExtended, SceneNode2 } from './create-ts-compiler/canvas-utils.js';
import { isComponent, isInstance } from './create-ts-compiler/canvas-utils.js';
import { cssAstToString, mkRawCss, mkStylesheetCss } from './css-gen/css-factories-low.js';
import {
  getComponentName,
  mkCompFunction,
  mkDefaultImportDeclaration,
  mkNamedImportsDeclaration,
  mkPropInterface,
} from './gen-node-utils/ts-ast-utils.js';
import { warnNode } from './gen-node-utils/utils-and-reset.js';
import { getCSSExtension } from './tech-integration/scss/scss-utils.js';

const { factory } = ts;

export function getOrGenComponent(
  parentModuleContext: ModuleContext,
  node: SceneNode2,
  parent: ParentNode | Nil,
  isRootComponent = false,
  skipAddImport = false,
) {
  const {
    projectContext: { compNodes, components },
  } = parentModuleContext;
  let comp = getComponentOrNil(compNodes, node);
  if (!isRootComponent && !comp) {
    warnOrThrow(`Node ${node.name} is not the root node, but it isn't a component or an instance.`);
  }
  if (!flags.enableInstanceOverrides || !comp) {
    const moduleContext = createModuleContextForNode(parentModuleContext, node, parent, isRootComponent);
    components.set(comp?.id || '_root', moduleContext);
    if (!skipAddImport) {
      ensureComponentIsImported(parentModuleContext, moduleContext);
    }
    return moduleContext;
  }
  assertDefined(comp);
  let moduleContext = components.get(comp.id);
  if (!moduleContext) {
    moduleContext = createModuleContextForNode(parentModuleContext, comp, parent, isRootComponent);
    components.set(comp.id, moduleContext);
  }
  if (!skipAddImport) {
    ensureComponentIsImported(parentModuleContext, moduleContext);
  }
  return moduleContext;
}

function assertDefined(variable: any): asserts variable {
  return;
}

function getComponentOrNil(compNodes: Dict<ComponentNode2>, node: SceneNode2) {
  let comp: ComponentNode2 | Nil;

  if (isInstance(node)) {
    comp = node.mainComponent;
    if (comp) {
      comp = compNodes[comp.id];
      if (!comp) {
        warnNode(node, 'Component source not found for instance. The instance will be treated as a frame.');
      }
    }
  } else if (isComponent(node)) {
    comp = node;
  }

  return comp;
}

function ensureComponentIsImported(parentModuleContext: ModuleContext, moduleContext: ModuleContext) {
  const { compDir: callerCompDir, imports: callerImports, projectContext } = parentModuleContext;
  const { compDir, compName } = moduleContext;

  if (callerImports[compName]) return;

  let moduleSpecifier = `${relative(callerCompDir, compDir)}/${compName}`;
  if (moduleSpecifier.startsWith('/')) {
    moduleSpecifier = `.${moduleSpecifier}`;
  } else if (!moduleSpecifier.startsWith('.')) {
    moduleSpecifier = `./${moduleSpecifier}`;
  }

  const ext = projectContext.extraConfig.useZipProjectTemplate ? '.js' : '';
  callerImports[compName] = mkNamedImportsDeclaration([compName], `${moduleSpecifier}${ext}`);
}

// Although it's quite verbose, we put the ModuleContext creation in a separate function, that is also called in 2-create-ts-compiler.ts for the root App.tsx component. It avoids mistakes when adding more content to the context.
export function mkModuleContext(
  projectContext: ProjectContext,
  node: SceneNode2,
  pageName: string | undefined,
  compDir: string,
  compName: string,
  parentModuleContext: ModuleContext | undefined,
  isRootComponent: boolean,
  isComp: boolean,
  skipNodeRendering = false,
) {
  const moduleContext: ModuleContext = {
    projectContext,
    node,
    imports: {},
    statements: [],
    pageName,
    compDir,
    compName,
    classNamesAlreadyUsed: new Set(['root']),
    classOverrides: new Set(),
    swaps: new Set(),
    subComponentNamesAlreadyUsed: new Set([compName]),
    importsAlreadyAdded: new Map(),
    cssRules: [],
    inInteractiveElement: parentModuleContext?.inInteractiveElement || false,
    isRootComponent,
    isComponent: isComp,
    hideProps: new Set(),
    textOverrideProps: new Set(),
  };
  return moduleContext;
}

function createModuleContextForNode(
  parentModuleContext: ModuleContext,
  node: SceneNode2,
  parent: ParentNode | Nil,
  isRootComponent = false,
) {
  const { projectContext } = parentModuleContext;

  const isComp = isComponent(node);

  const pageName = parentModuleContext.pageName;
  const compName = getComponentName(projectContext, node);
  const compDir = pageName ? `src/components/${pageName}/${compName}` : `src/components/${compName}`;

  const moduleContext = mkModuleContext(
    projectContext,
    node,
    pageName || compName,
    compDir,
    compName,
    parentModuleContext,
    isRootComponent,
    isComp,
  );
  node.isRootInComponent = true;
  prepareRootNode(moduleContext, node, parent);

  return moduleContext;
}

export function generateAllComponents(projectContext: ProjectContext) {
  const { components } = projectContext;
  for (const [_, moduleContext] of components) {
    const [tsx, css] = genAstFromRootNode(moduleContext);

    const { compDir, compName, imports } = moduleContext;
    const { cssFiles } = projectContext;

    createModuleCode(moduleContext, tsx);

    if (isNonEmptyObject(css.children)) {
      const cssExt = getCSSExtension(projectContext.extraConfig);
      const cssFileName = `${compName}.module.${cssExt}`;
      cssFiles[`${compDir}/${cssFileName}`] = cssAstToString(css);
      const cssModuleModuleSpecifier = `./${cssFileName}`;
      imports[cssModuleModuleSpecifier] = mkDefaultImportDeclaration('classes', cssModuleModuleSpecifier);
    }

    printFileInProject(moduleContext);
  }
}

export function createModuleCode(
  moduleContext: ModuleContext,
  tsx: JsxOneOrMore | undefined,
  prefixStatements: Statement[] = [],
  skipAnnotation?: boolean,
) {
  const { imports, statements, compName } = moduleContext;

  // Add React imports: import { FC, memo } from 'react';
  imports['react'] = mkNamedImportsDeclaration(
    ['memo', ...(moduleContext.projectContext.extraConfig.isFTD && compName === 'App' ? ['useCallback'] : [])],
    'react',
  );
  imports['react#types'] = mkNamedImportsDeclaration(
    ['FC', ...(moduleContext.swaps.size > 0 || moduleContext.textOverrideProps.size > 0 ? ['ReactNode'] : [])],
    'react',
    true,
  );

  // Add component Prop interface
  statements.push(mkPropInterface(moduleContext));

  // Add the component
  statements.push(mkCompFunction(moduleContext, compName, tsx, prefixStatements, skipAnnotation));
}

export function printFileInProject(moduleContext: ModuleContext) {
  const { projectContext, compDir, compName } = moduleContext;

  const path = `${compDir}/${compName}.tsx`;
  const resultFile = factory.createSourceFile(
    [...Object.values(moduleContext.imports), ...moduleContext.statements],
    factory.createToken(ts.SyntaxKind.EndOfFileToken),
    ts.NodeFlags.None,
  );
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
    omitTrailingSemicolon: false,
  });

  const result = printer.printFile(resultFile);
  projectContext.tsFiles[path] = result;
}

function prepareRootNode(moduleContext: ModuleContext, root: SceneNode2, parent: ParentNode | Nil) {
  const nodeContext = createNodeContext(moduleContext, root, parent);
  if (!root.isRootInComponent) {
    warnOrThrow('BUG missing isRootInComponent flag?');
  }
  prepareNode(nodeContext, root);
}

function genAstFromRootNode(moduleContext: ModuleContext) {
  const { node } = moduleContext;
  const { nodeContext: context } = node;
  if (!context) throw new Error(`[genNodeAst] node ${node.name} has no nodeContext`);
  context.isRootInComponent = true;
  const tsx = genNodeAst(node);
  const { scss, bem } = moduleContext.projectContext.extraConfig;
  const useBem = scss && bem;
  if (useBem) {
    generateScssBemTree2(moduleContext.cssRules as RulePlain[]);
  }
  const cssAst = mkStylesheetCss(moduleContext.cssRules);
  return [tsx, cssAst] as const;
}

function generateScssBemTree2(rules: RulePlain[]) {
  for (const rule of rules) {
    const rule2 = rule as RulePlainExtended;
    const childRules = rule2.childRules;
    if (childRules) {
      generateScssBemTree2(childRules);
      const childStylesRoot = mkStylesheetCss(childRules);
      const childStylesRootStr = cssAstToString(childStylesRoot);
      rule.block.children.push(mkRawCss(childStylesRootStr));
    }
    delete rule2.childRules;
    delete rule2.parentRule;
  }
}

export function createNodeContext(moduleContext: ModuleContext, root: SceneNode2, parent: ParentNode | Nil) {
  const nodeContext: NodeContext = {
    moduleContext,
    tagName: 'div', // Default value
    nodeNameLower: root.name.toLowerCase(),
    parentNode: parent,
    parentStyles: null,
    parentContext: null,
    isRootNode: moduleContext.isRootComponent,
    isRootInComponent: !!root.isRootInComponent,
  };
  root.nodeContext = nodeContext;
  return nodeContext;
}
