import { relative } from 'path';
import ts, { Statement } from 'typescript';

import { isNonEmptyObject, Nil } from '../../common/general-utils';
import { flags } from '../../env-and-config/app-config';
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
) {
  const {
    projectContext: { compNodes, components },
  } = parentModuleContext;
  const isComp = isComponent(node);
  const isInst = isInstance(node);
  let comp: ComponentNode2 | Nil;
  if (isInst) {
    comp = node.mainComponent;
    if (comp) {
      comp = compNodes[comp.id];
      if (!comp) {
        warnNode(node, 'Component source not found for instance. The instance will be treated as a frame.');
      }
    }
  } else if (isComp) {
    comp = node;
  }
  if (!flags.enableInstanceOverrides || !comp) {
    const moduleContext = genComponent(parentModuleContext, node, parent, isRootComponent);
    ensureComponentIsImported(parentModuleContext, moduleContext);
    return moduleContext;
  }
  let moduleContext = components.get(comp.id);
  if (!moduleContext) {
    moduleContext = genComponent(parentModuleContext, comp, parent, isRootComponent);
    components.set(comp.id, moduleContext);
  }
  ensureComponentIsImported(parentModuleContext, moduleContext);
  return moduleContext;
}

function ensureComponentIsImported(parentModuleContext: ModuleContext, moduleContext: ModuleContext) {
  const { compDir: callerCompDir, imports: callerImports } = parentModuleContext;
  const { compDir, compName } = moduleContext;

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
    imports: {},
    statements: [],
    pageName,
    compDir,
    compName,
    classNamesAlreadyUsed: new Set(),
    subComponentNamesAlreadyUsed: new Set([compName]),
    importsAlreadyAdded: new Map(),
    cssRules: [],
    inInteractiveElement: parentModuleContext?.inInteractiveElement || false,
    isRootComponent,
    isComponent: isComp,
    classes: new Set(),
    swappableInstances: new Set(),
  };
  return moduleContext;
}

function genComponent(
  parentModuleContext: ModuleContext,
  node: SceneNode2,
  parent: ParentNode | Nil,
  isRootComponent = false,
) {
  const { projectContext } = parentModuleContext;
  const { cssFiles } = projectContext;

  const isComp = isComponent(node);
  const isInst = isInstance(node);
  if (isComp || isInst) {
    node = { ...node, type: 'FRAME' as const };
  }

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

  const { imports } = moduleContext;

  const [tsx, css] = figmaToAstRootNode(moduleContext, node, parent);

  createModuleCode(moduleContext, tsx);

  if (isNonEmptyObject(css.children)) {
    cssFiles[`${compDir}/${compName}.module.css`] = cssAstToString(css);
    const cssModuleModuleSpecifier = `./${compName}.module.css`;
    imports[cssModuleModuleSpecifier] = mkDefaultImportDeclaration('classes', cssModuleModuleSpecifier);
  }

  printFileInProject(moduleContext);

  return moduleContext;
}

export function createModuleCode(
  moduleContext: ModuleContext,
  tsx: JsxOneOrMore | undefined,
  prefixStatements: Statement[] = [],
) {
  const { imports, statements, compName, classes: classesSet } = moduleContext;

  const classes = Array.from(classesSet);

  // Add React imports: import { FC, memo } from 'react';
  imports['react'] = mkNamedImportsDeclaration(
    [
      'FC',
      'memo',
      ...(moduleContext.swappableInstances.size > 0 ? ['ReactNode'] : []),
      ...(moduleContext.projectContext.extraConfig.isFTD && compName === 'App' ? ['useCallback'] : []),
    ],
    'react',
  );

  // Add component Prop interface
  statements.push(mkPropInterface(moduleContext, classes));

  // Add the component
  statements.push(mkCompFunction(compName, classes, tsx, prefixStatements));
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
  };
  const tsx = figmaToAstRec(nodeContext, root, true);
  const cssAst = mkStylesheetCss(moduleContext.cssRules);
  return [tsx, cssAst] as const;
}
