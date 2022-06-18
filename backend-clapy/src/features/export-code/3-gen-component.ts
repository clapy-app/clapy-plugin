import { StyleSheetPlain } from 'css-tree';
import { relative } from 'path';
import ts, { Statement } from 'typescript';

import { isNonEmptyObject, Nil } from '../../common/general-utils';
import { flags } from '../../env-and-config/app-config';
import { warnOrThrow } from '../../utils';
import { Dict } from '../sb-serialize-preview/sb-serialize.model';
import { figmaToAstRec } from './4-gen-node';
import { JsxOneOrMore, ModuleContext, NodeContext, ParentNode, ProjectContext } from './code.model';
import { ComponentNode2, isComponent, isInstance, SceneNode2 } from './create-ts-compiler/canvas-utils';
import { cssAstToString, mkStylesheetCss } from './css-gen/css-factories-low';
import {
  getComponentName,
  mkCompFunction,
  mkDefaultImportDeclaration,
  mkNamedImportsDeclaration,
  mkPropInterface,
} from './figma-code-map/details/ts-ast-utils';
import { warnNode } from './figma-code-map/details/utils-and-reset';

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
  if (!flags.enableInstanceOverrides || !comp) {
    const moduleContext = createModuleContextForNode(parentModuleContext, node, parent, isRootComponent);
    components.set(comp?.id || '_root', moduleContext);
    if (!skipAddImport) {
      ensureComponentIsImported(parentModuleContext, moduleContext);
    }
    return moduleContext;
  }
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
  const { compDir: callerCompDir, imports: callerImports } = parentModuleContext;
  const { compDir, compName } = moduleContext;

  if (callerImports[compName]) return;

  let moduleSpecifier = `${relative(callerCompDir, compDir)}/${compName}`;
  if (moduleSpecifier.startsWith('/')) {
    moduleSpecifier = `.${moduleSpecifier}`;
  } else if (!moduleSpecifier.startsWith('.')) {
    moduleSpecifier = `./${moduleSpecifier}`;
  }

  callerImports[compName] = mkNamedImportsDeclaration([compName], moduleSpecifier);
}

// Although it's quite verbose, we put the ModuleContext creation in a separate function, that is also called in 2-create-ts-compiler.ts for the root App.tsx component. It avoids mistakes when adding more content to the context.
export function mkModuleContext(
  projectContext: ProjectContext,
  node: SceneNode2,
  parent: ParentNode | Nil,
  pageName: string | undefined,
  compDir: string,
  compName: string,
  parentModuleContext: ModuleContext | undefined,
  isRootComponent: boolean,
  isComp: boolean,
) {
  const moduleContext: ModuleContext = {
    projectContext,
    node,
    parent,
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
    parent,
    pageName || compName,
    compDir,
    compName,
    parentModuleContext,
    isRootComponent,
    isComp,
  );
  node.isRootInComponent = true;

  return moduleContext;
}

interface CompReadyToWrite {
  moduleContext: ModuleContext;
  tsx: JsxOneOrMore | undefined;
  css: StyleSheetPlain;
}

export function generateAllComponents(projectContext: ProjectContext) {
  const { components } = projectContext;
  const compReadyToWrite: CompReadyToWrite[] = [];
  for (const [_, moduleContext] of components) {
    const { node, parent } = moduleContext;

    const [tsx, css] = figmaToAstRootNode(moduleContext, node, parent);

    compReadyToWrite.push({
      moduleContext,
      tsx,
      css,
    });
  }

  for (const { moduleContext, tsx, css } of compReadyToWrite) {
    const { compDir, compName, imports } = moduleContext;
    const { cssFiles } = projectContext;

    createModuleCode(moduleContext, tsx);

    if (isNonEmptyObject(css.children)) {
      cssFiles[`${compDir}/${compName}.module.css`] = cssAstToString(css);
      const cssModuleModuleSpecifier = `./${compName}.module.css`;
      imports[cssModuleModuleSpecifier] = mkDefaultImportDeclaration('classes', cssModuleModuleSpecifier);
    }

    printFileInProject(moduleContext);
  }
}

export function createModuleCode(
  moduleContext: ModuleContext,
  tsx: JsxOneOrMore | undefined,
  prefixStatements: Statement[] = [],
) {
  const { imports, statements, compName } = moduleContext;

  // Add React imports: import { FC, memo } from 'react';
  imports['react'] = mkNamedImportsDeclaration(
    [
      'FC',
      'memo',
      ...(moduleContext.swaps.size > 0 || moduleContext.textOverrideProps.size > 0 ? ['ReactNode'] : []),
      ...(moduleContext.projectContext.extraConfig.isFTD && compName === 'App' ? ['useCallback'] : []),
    ],
    'react',
  );

  // Add component Prop interface
  statements.push(mkPropInterface(moduleContext));

  // Add the component
  statements.push(mkCompFunction(moduleContext, compName, tsx, prefixStatements));
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

function figmaToAstRootNode(moduleContext: ModuleContext, root: SceneNode2, parent: ParentNode | Nil) {
  const nodeContext: NodeContext = {
    moduleContext,
    tagName: 'div', // Default value
    nodeNameLower: root.name.toLowerCase(),
    parentNode: parent,
    parentStyles: null,
    parentContext: null,
    isRootNode: moduleContext.isRootComponent,
    isRootInComponent: true,
  };
  if (!root.isRootInComponent) {
    warnOrThrow('BUG missing isRootInComponent flag?');
  }
  const tsx = figmaToAstRec(nodeContext, root);
  const cssAst = mkStylesheetCss(moduleContext.cssRules);
  return [tsx, cssAst] as const;
}
