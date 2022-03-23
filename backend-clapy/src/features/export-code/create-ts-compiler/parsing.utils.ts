import { ExportedDeclarations, Expression, Node, ScriptTarget, SourceFile, Symbol, ts } from 'ts-morph';

import { JsxNode, ProjectComponent } from './file.model';

export function getLastReturnedExpression() {}

// This code can be merged with query-ast.ts utils if it needs to be re-used.

export function listExportedComponentsInFile(file: SourceFile): ProjectComponent[] {
  const components: ProjectComponent[] = [];
  for (const exp of file.getExportedDeclarations().values()) {
    for (const decl of exp) {
      const component = getExportedComponent(decl, file);
      if (component) {
        components.push(component);
      }
    }
  }
  return components;
}

export function getFirstExportedComponentsInFileOrThrow(file: SourceFile): ProjectComponent {
  const res = getFirstExportedComponentsInFile(file);
  if (!res) throw new Error(`getFirstExportedComponentsInFile returned undefined`);
  return res;
}

export function getFirstExportedComponentsInFile(file: SourceFile): ProjectComponent | undefined {
  for (const exp of file.getExportedDeclarations().values()) {
    for (const decl of exp) {
      const component = getExportedComponent(decl, file);
      if (component) {
        return component;
      }
    }
  }
  return undefined;
}

/**
 * @param compDeclaration Export declaration in the AST tree.
 * @param file The file containing the declaration.
 * @return {ProjectComponent | undefined} Exported component if the export is a React component
 * or undefined if the export is not a component.
 */
function getExportedComponent(compDeclaration: ExportedDeclarations, file: SourceFile): ProjectComponent | undefined {
  if (!Node.isFunctionDeclaration(compDeclaration)) {
    return;
  }
  const body = compDeclaration.getBodyOrThrow();
  let lastName: string | undefined = undefined;
  let lastJsxFound: JsxNode | undefined = undefined;
  let returnedExpression: Expression | undefined = undefined;
  for (const statement of body.getDescendantStatements()) {
    if (Node.isReturnStatement(statement)) {
      const expression = statement.getExpressionOrThrow();
      const nameIdentifier = compDeclaration.getNameNodeOrThrow();
      const name = nameIdentifier.getText();
      const returned = getReturnedJsx(expression);
      if (returned) {
        lastName = name;
        lastJsxFound = returned;
        returnedExpression = expression;
      }
    }
  }
  if (!lastJsxFound || !returnedExpression) {
    // No jsx returned, it is probably not a React component. Ignore it.
    return;
  }
  if (!lastName) {
    console.warn('Could not find the component name for JSX:', lastJsxFound.getText());
    lastName = 'NameNotFoundComponent';
  }
  return {
    name: lastName,
    file,
    path: getComponentPath(file.getFilePath(), lastName),
    jsx: lastJsxFound,
    returnedExpression,
    compDeclaration,
  };
}

export function getComponentPath(filePath: string, componentName: string | undefined): string {
  if (!componentName) {
    console.warn('Name not found for component in file:', filePath);
  }
  return `${filePath}#${componentName || 'NameNotFoundComponent'}`;
}

function getReturnedJsx(jsx: Node): JsxNode | undefined {
  if (Node.isParenthesizedExpression(jsx)) {
    return getReturnedJsx(jsx.getExpression());
  }
  if (!isJsxChild(jsx)) {
    // Not a JSX expression; this function is probably not a React component. We shoult skip it.
    // console.log(`Unsupported jsx expression, not a JsxChild: ${printNode(jsx)}`);
    return;
  }
  return jsx;
}

export function isJsxChild(node: Node): node is JsxNode {
  return (
    Node.isJsxText(node) ||
    Node.isJsxExpression(node) ||
    Node.isJsxElement(node) ||
    Node.isJsxSelfClosingElement(node) ||
    Node.isJsxFragment(node)
  );
}

export function printNode(node: Node | undefined) {
  if (!node) {
    return `Node ${node}`;
  }
  return `${node.getKindName()} (${node.getKind()}): ${node.print() || node.getText()}`;
}

export function printStandalone(node: ts.Node | undefined) {
  if (!node) {
    return `Node ${node}`;
  }
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  return printer.printNode(ts.EmitHint.Unspecified, node, ts.createSourceFile('foo.ts', '', ScriptTarget.ESNext, true));
}

export function getSymbolDeclarationOrThrow(symbol: Symbol): Node {
  return getSymbolDeclaration(symbol, true) as Node;
}

export function getSymbolDeclaration(symbol: Symbol, orThrow?: boolean): Node | undefined {
  const decl = symbol.getValueDeclaration();
  if (decl) return decl;
  const decls = symbol.getDeclarations();
  if (!decls) return orThrow ? _throw(new Error(`No declarations array for symbol ${symbol.getName()}`)) : undefined;
  if (!decls[0]) return orThrow ? _throw(new Error(`No declarations found for symbol ${symbol.getName()}`)) : undefined;
  return decls[0];
}

function _throw(error: Error): undefined {
  throw error;
}
