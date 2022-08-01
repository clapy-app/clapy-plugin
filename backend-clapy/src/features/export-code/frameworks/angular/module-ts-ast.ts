import { relative } from 'path';
import type { ImportDeclaration } from 'typescript';
import ts from 'typescript';

import type { ModuleContext } from '../../code.model';

const { factory } = ts;

export function getModuleTsAst(appModuleContext: ModuleContext) {
  const { projectContext, compDir: appDir } = appModuleContext;
  const imports: ImportDeclaration[] = [];
  const identifiers: ts.Identifier[] = [factory.createIdentifier('AppComponent')];
  // .js extensions in imports don't seem to be supported by Angular CLI.
  // const ext = projectContext.extraConfig.useZipProjectTemplate ? '.js' : '';
  const ext = '';
  for (const { compDir, baseCompName, compName } of projectContext.components.values()) {
    let moduleSpecifier = `${relative(appDir, compDir)}/${baseCompName}.component${ext}`;
    if (!moduleSpecifier.startsWith('.')) moduleSpecifier = `./${moduleSpecifier}`;
    imports.push(
      factory.createImportDeclaration(
        undefined,
        undefined,
        factory.createImportClause(
          false,
          undefined,
          factory.createNamedImports([
            factory.createImportSpecifier(false, undefined, factory.createIdentifier(compName)),
          ]),
        ),
        factory.createStringLiteral(moduleSpecifier),
        undefined,
      ),
    );
    identifiers.push(factory.createIdentifier(compName));
  }
  return [
    factory.createImportDeclaration(
      undefined,
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(false, undefined, factory.createIdentifier('NgModule')),
        ]),
      ),
      factory.createStringLiteral('@angular/core'),
      undefined,
    ),
    factory.createImportDeclaration(
      undefined,
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(false, undefined, factory.createIdentifier('BrowserModule')),
        ]),
      ),
      factory.createStringLiteral('@angular/platform-browser'),
      undefined,
    ),
    factory.createImportDeclaration(
      undefined,
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(false, undefined, factory.createIdentifier('AppComponent')),
        ]),
      ),
      factory.createStringLiteral('./app.component'),
      undefined,
    ),
    ...imports,
    factory.createClassDeclaration(
      [
        factory.createDecorator(
          factory.createCallExpression(factory.createIdentifier('NgModule'), undefined, [
            factory.createObjectLiteralExpression(
              [
                factory.createPropertyAssignment(
                  factory.createIdentifier('declarations'),
                  factory.createArrayLiteralExpression(identifiers, true),
                ),
                factory.createPropertyAssignment(
                  factory.createIdentifier('imports'),
                  factory.createArrayLiteralExpression([factory.createIdentifier('BrowserModule')], true),
                ),
                factory.createPropertyAssignment(
                  factory.createIdentifier('providers'),
                  factory.createArrayLiteralExpression([], false),
                ),
                factory.createPropertyAssignment(
                  factory.createIdentifier('bootstrap'),
                  factory.createArrayLiteralExpression([factory.createIdentifier('AppComponent')], false),
                ),
              ],
              true,
            ),
          ]),
        ),
      ],
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      factory.createIdentifier('AppModule'),
      undefined,
      undefined,
      [],
    ),
  ];
}
