import ts from 'typescript';

import type { ModuleContext } from '../../code.model';
import { wrapWithFigmaIdAnnotation } from '../../gen-node-utils/ts-ast-utils.js';
import { getCSSExtension } from '../../tech-integration/scss/scss-utils.js';

const { factory } = ts;

export function getComponentTsAst(
  moduleContext: ModuleContext,
  compNameOverride: string | undefined,
  hasCss: boolean | undefined,
  skipAnnotation: boolean,
) {
  const { projectContext, baseCompName, compName } = moduleContext;
  const { angularPrefix } = projectContext.extraConfig;
  const cssExt = getCSSExtension(projectContext);

  const imports = [
    factory.createImportDeclaration(
      undefined,
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(false, undefined, factory.createIdentifier('Component')),
        ]),
      ),
      factory.createStringLiteral('@angular/core'),
      undefined,
    ),
    factory.createImportDeclaration(
      undefined,
      undefined,
      factory.createImportClause(
        true,
        undefined,
        factory.createNamedImports([
          factory.createImportSpecifier(false, undefined, factory.createIdentifier('OnInit')),
        ]),
      ),
      factory.createStringLiteral('@angular/core'),
      undefined,
    ),
  ];

  const classDeclaration = factory.createClassDeclaration(
    [
      factory.createDecorator(
        factory.createCallExpression(factory.createIdentifier('Component'), undefined, [
          factory.createObjectLiteralExpression(
            [
              factory.createPropertyAssignment(
                factory.createIdentifier('selector'),
                factory.createStringLiteral(compNameOverride || `${angularPrefix}-${baseCompName}`),
              ),
              factory.createPropertyAssignment(
                factory.createIdentifier('templateUrl'),
                factory.createStringLiteral(`./${baseCompName}.component.html`),
              ),
              ...(hasCss
                ? [
                    factory.createPropertyAssignment(
                      factory.createIdentifier('styleUrls'),
                      factory.createArrayLiteralExpression(
                        [factory.createStringLiteral(`./${baseCompName}.component.${cssExt}`)],
                        false,
                      ),
                    ),
                  ]
                : []),
            ],
            true,
          ),
        ]),
      ),
    ],
    [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    factory.createIdentifier(compName),
    undefined,
    [
      factory.createHeritageClause(ts.SyntaxKind.ImplementsKeyword, [
        factory.createExpressionWithTypeArguments(factory.createIdentifier('OnInit'), undefined),
      ]),
    ],
    [
      factory.createConstructorDeclaration(undefined, undefined, [], factory.createBlock([], false)),
      factory.createMethodDeclaration(
        undefined,
        undefined,
        undefined,
        factory.createIdentifier('ngOnInit'),
        undefined,
        undefined,
        [],
        factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
        factory.createBlock([], true),
      ),
    ],
  );

  if (!skipAnnotation) {
    wrapWithFigmaIdAnnotation(classDeclaration, moduleContext);
  }

  return [...imports, classDeclaration];
}
