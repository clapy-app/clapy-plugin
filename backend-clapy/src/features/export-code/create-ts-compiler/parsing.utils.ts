import { Node, ScriptTarget, ts } from 'ts-morph';
import { JsxNode } from './file.model';

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

export function printStandalone(node: ts.Node | ts.Node[] | undefined) {
  if (!node) {
    return `Node ${node}`;
  }
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  if (Array.isArray(node)) {
    for (const child of node) {
      printer.printNode(ts.EmitHint.Unspecified, child, ts.createSourceFile('foo.ts', '', ScriptTarget.ESNext, true));
    }
  } else {
    return printer.printNode(
      ts.EmitHint.Unspecified,
      node,
      ts.createSourceFile('foo.ts', '', ScriptTarget.ESNext, true),
    );
  }
}
