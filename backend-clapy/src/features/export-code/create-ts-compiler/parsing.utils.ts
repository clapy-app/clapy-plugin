import type { ChildNode } from 'parse5/dist/tree-adapters/default.js';
import ts from 'typescript';

import type { FwNodeOneOrMore } from '../frameworks/framework-connectors.js';

const { ScriptTarget } = ts;

export function printStandalone(node: ts.Node | ts.Node[] | FwNodeOneOrMore | undefined) {
  if (!node) {
    return `Node ${node}`;
  }
  if (!isNotHtmlChildNode(node)) {
    console.log(node);
    return;
  }
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  if (Array.isArray(node)) {
    for (const child of node) {
      console.log(
        printer.printNode(ts.EmitHint.Unspecified, child, ts.createSourceFile('foo.ts', '', ScriptTarget.ESNext, true)),
      );
    }
  } else {
    return printer.printNode(
      ts.EmitHint.Unspecified,
      node,
      ts.createSourceFile('foo.ts', '', ScriptTarget.ESNext, true),
    );
  }
}

function isNotHtmlChildNode(
  node: ts.Node | ts.Node[] | FwNodeOneOrMore,
): node is ts.Node | ts.Node[] | ts.JsxChild | ts.JsxChild[] {
  return !(!Array.isArray(node) ? !!(node as ChildNode).nodeName : !node.length || !!(node[0] as ChildNode).nodeName);
}
