import { relative } from 'path';
import ts, { Statement } from 'typescript';

import { isNonEmptyObject, Nil } from '../../common/general-utils';
import { flags } from '../../env-and-config/app-config';
import { figmaToAstRec } from './4-gen-node';
import { JsxOneOrMore, ModuleContext, NodeContext, ParentNode } from './code.model';
import { ComponentNode2, isComponent, isInstance, SceneNode2 } from './create-ts-compiler/canvas-utils';
import { getCSSExtension } from './frameworks/scss/scss-utils.js';
import { cssAstToString, mkStylesheetCss } from './css-gen/css-factories-low';
import {
  genUniqueName,
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
    return genComponent(parentModuleContext, node, parent, isRootComponent);
  }
  let moduleContext = components.get(comp.id);
  if (!moduleContext) {
    moduleContext = genComponent(parentModuleContext, comp, parent, isRootComponent);
    components.set(comp.id, moduleContext);
  }
  return moduleContext;
}

function genComponent(
  parentModuleContext: ModuleContext,
  node: SceneNode2,
  parent: ParentNode | Nil,
  isRootComponent = false,
) {
  const { projectContext, compDir: callerCompDir, imports: callerImports } = parentModuleContext;
  const { cssFiles } = projectContext;

  const isComp = isComponent(node);
  const isInst = isInstance(node);
  if (isComp || isInst) {
    node = { ...node, type: 'FRAME' as const };
  }

  const pageName = parentModuleContext.pageName;
  const compName = genUniqueName(projectContext.compNamesAlreadyUsed, node.name, true);
  const compDir = pageName ? `src/components/${pageName}/${compName}` : `src/components/${compName}`;

  const moduleContext: ModuleContext = {
    projectContext,
    node,
    imports: [],
    statements: [],
    pageName: pageName || compName,
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
  };

  const { imports, statements } = moduleContext;

  const [tsx, css] = figmaToAstRootNode(moduleContext, node, parent);

  const classesArr = Array.from(moduleContext.classes);

  createModuleCode(moduleContext, tsx, classesArr);

  if (isNonEmptyObject(css.children)) {
    const cssExt = getCSSExtension(projectContext.extraConfig);
    const cssFileName = `${compName}.module.${cssExt}`;
    cssFiles[`${compDir}/${cssFileName}`] = cssAstToString(css);
    imports.push(mkDefaultImportDeclaration('classes', `./${cssFileName}`));
  }

  let moduleSpecifier = `${relative(callerCompDir, compDir)}/${compName}`;
  if (moduleSpecifier.startsWith('/')) {
    moduleSpecifier = `.${moduleSpecifier}`;
  } else if (!moduleSpecifier.startsWith('.')) {
    moduleSpecifier = `./${moduleSpecifier}`;
  }

  // Then update the file consuming the component.
  // TODO a bit weird to have it here, it's a side-effect we may not understand from outside this function ("auto-magic" import). To move out of this function?
  callerImports.push(mkNamedImportsDeclaration([compName], moduleSpecifier));

  printFileInProject(moduleContext);

  return moduleContext;
}

export function createModuleCode(
  moduleContext: ModuleContext,
  tsx: JsxOneOrMore | undefined,
  classes: string[],
  prefixStatements: Statement[] = [],
) {
  const { imports, statements, compName } = moduleContext;

  // Add React imports: import { FC, memo } from 'react';

  imports.push(
    mkNamedImportsDeclaration(
      ['FC', 'memo', ...(moduleContext.projectContext.extraConfig.isFTD && compName === 'App' ? ['useCallback'] : [])],
      'react',
    ),
  );

  // Add component Prop interface
  statements.push(mkPropInterface(classes));

  // Add the component
  statements.push(mkCompFunction(compName, classes, tsx, prefixStatements));
}

export function printFileInProject(moduleContext: ModuleContext) {
  const { projectContext, compDir, compName } = moduleContext;

  const path = `${compDir}/${compName}.tsx`;
  const resultFile = factory.createSourceFile(
    [...moduleContext.imports, ...moduleContext.statements],
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
