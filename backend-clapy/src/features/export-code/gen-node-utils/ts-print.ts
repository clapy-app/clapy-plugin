import type { Printer, Statement } from 'typescript';
import ts from 'typescript';

const { factory } = ts;

let printer: Printer;

function getPrinter() {
  if (!printer) {
    printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
      removeComments: false,
      omitTrailingSemicolon: false,
    });
  }
  return printer;
}

export function printTsStatements(statements: Statement[]) {
  const sourceFile = factory.createSourceFile(
    statements,
    factory.createToken(ts.SyntaxKind.EndOfFileToken),
    ts.NodeFlags.None,
  );

  return getPrinter().printFile(sourceFile);
}
