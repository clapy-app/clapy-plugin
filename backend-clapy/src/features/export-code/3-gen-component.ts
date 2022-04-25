import { relative } from 'path';
import ts from 'typescript';

import { isNonEmptyObject } from '../../common/general-utils';
import { figmaToAstRec } from './4-gen-node';
import { ComponentContext, NodeContext, ParentNode } from './code.model';
import { SceneNode2 } from './create-ts-compiler/canvas-utils';
import { cssAstToString, mkStylesheetCss } from './css-gen/css-factories-low';
import {
  genUniqueName,
  mkCompFunction,
  mkDefaultImportDeclaration,
  mkNamedImportsDeclaration,
} from './figma-code-map/details/ts-ast-utils';

const { factory } = ts;

export async function genComponent(
  parentCompContext: ComponentContext,
  node: SceneNode2,
  parent: ParentNode,
  isRootComponent = false,
) {
  const { projectContext, compDir: callerCompDir, imports: callerImports } = parentCompContext;
  const { cssFiles } = projectContext;

  const pageName = parentCompContext.pageName;
  const compName = genUniqueName(projectContext.compNamesAlreadyUsed, node.name, true);
  const compDir = pageName ? `src/components/${pageName}/${compName}` : `src/components/${compName}`;

  const componentContext: ComponentContext = {
    projectContext,
    imports: [],
    statements: [],
    pageName: pageName || compName,
    compDir,
    compName,
    classNamesAlreadyUsed: new Set(),
    importNamesAlreadyUsed: new Set(),
    cssRules: [],
    inInteractiveElement: parentCompContext?.inInteractiveElement || false,
    isRootComponent,
  };

  const { imports, statements } = componentContext;

  const [tsx, css] = await figmaToAstRootNode(componentContext, node, parent);

  statements.push(mkCompFunction(compName, tsx));

  if (isNonEmptyObject(css.children)) {
    cssFiles[`${compDir}/${compName}.module.css`] = cssAstToString(css);
    imports.push(mkDefaultImportDeclaration('classes', `./${compName}.module.css`));
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

  printFileInProject(componentContext);

  return componentContext;
}

export function printFileInProject(componentContext: ComponentContext) {
  const { projectContext, compDir, compName } = componentContext;

  const path = `${compDir}/${compName}.tsx`;
  const resultFile = factory.createSourceFile(
    [...componentContext.imports, ...componentContext.statements],
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

async function figmaToAstRootNode(componentContext: ComponentContext, root: SceneNode2, parent: ParentNode) {
  const nodeContext: NodeContext = {
    componentContext,
    tagName: 'div', // Default value
    nodeNameLower: root.name.toLowerCase(),
    parentNode: parent,
    parentStyles: null,
    parentContext: null,
    isRootNode: componentContext.isRootComponent,
  };
  const tsx = await figmaToAstRec(nodeContext, root, true);
  const cssAst = mkStylesheetCss(componentContext.cssRules);
  return [tsx, cssAst] as const;
}
