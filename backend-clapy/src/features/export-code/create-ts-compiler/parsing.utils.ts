import ts, { ScriptTarget } from 'typescript';

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
