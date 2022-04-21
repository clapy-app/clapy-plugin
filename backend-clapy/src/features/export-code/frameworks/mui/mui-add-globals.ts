import { SourceFile, ts, VariableDeclarationKind } from 'ts-morph';

import { ComponentContext, ProjectContext } from '../../code.model';
import { getSetInMap } from '../../figma-code-map/font';

const { factory } = ts;

const addBaseline = false;

export function addMUIFonts(context: ProjectContext) {
  const { fontWeightUsed, enableMUIFramework } = context;
  if (enableMUIFramework) {
    getSetInMap(fontWeightUsed, 'Roboto').add(300).add(400).add(500).add(700);
  }
}

export function addMUIProvidersImports(context: ComponentContext, appFile: SourceFile) {
  if (context.projectContext.enableMUIFramework) {
    const namedImports = ['createTheme', 'ThemeProvider'];
    if (addBaseline) {
      namedImports.push('CssBaseline');
    }
    appFile.addImportDeclaration({
      moduleSpecifier: '@mui/material',
      namedImports,
    });

    appFile.insertVariableStatement(0, {
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: 'theme',
          initializer: 'createTheme({})',
        },
      ],
    });
  }
}

export function addMUIProviders(context: ComponentContext, rootJsx: ts.JsxChild) {
  const { projectContext } = context;
  const { enableMUIFramework } = projectContext;
  if (!enableMUIFramework) return rootJsx;
  rootJsx = wrapWithFragmentAndBaseline(rootJsx);
  return rootJsx;
}

function wrapWithFragmentAndBaseline(jsx: ts.JsxChild) {
  return factory.createJsxFragment(
    factory.createJsxOpeningFragment(),
    [
      factory.createJsxElement(
        factory.createJsxOpeningElement(
          factory.createIdentifier('ThemeProvider'),
          undefined,
          factory.createJsxAttributes([
            factory.createJsxAttribute(
              factory.createIdentifier('theme'),
              factory.createJsxExpression(undefined, factory.createIdentifier('theme')),
            ),
          ]),
        ),
        addBaseline ? [mkBaselineTag(), jsx] : [jsx],
        factory.createJsxClosingElement(factory.createIdentifier('ThemeProvider')),
      ),
    ],
    factory.createJsxJsxClosingFragment(),
  );
}

function mkBaselineTag() {
  return factory.createJsxSelfClosingElement(
    factory.createIdentifier('CssBaseline'),
    undefined,
    factory.createJsxAttributes([]),
  );
}
