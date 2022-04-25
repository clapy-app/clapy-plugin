import ts from 'typescript';

import { ComponentContext, ProjectContext } from '../../code.model';
import { mkNamedImportsDeclaration } from '../../figma-code-map/details/ts-ast-utils';
import { getSetInMap } from '../../figma-code-map/font';

const { factory } = ts;

const addBaseline = false;

export function addMUIFonts(context: ProjectContext) {
  const { fontWeightUsed, enableMUIFramework } = context;
  if (enableMUIFramework) {
    getSetInMap(fontWeightUsed, 'Roboto').add(300).add(400).add(500).add(700);
  }
}

function mkThemeVarCreation() {
  return factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier('theme'),
          undefined,
          undefined,
          factory.createCallExpression(factory.createIdentifier('createTheme'), undefined, [
            factory.createObjectLiteralExpression([], false),
          ]),
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );
}

export function addMUIProvidersImports(lightAppComponentContext: ComponentContext) {
  if (lightAppComponentContext.projectContext.enableMUIFramework) {
    const { imports, statements } = lightAppComponentContext;
    const namedImports = ['createTheme', 'ThemeProvider'];
    if (addBaseline) {
      namedImports.push('CssBaseline');
    }
    imports.push(mkNamedImportsDeclaration(namedImports, '@mui/material'));

    statements.push(mkThemeVarCreation());
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

// Component overrides in the theme, examples from RTG:
// const MuiAppBar = {
//   defaultProps: {
//     position: 'sticky',
//     variant: 'outlined',
//     elevation: 0,
//   },
//   styleOverrides: {
//     zIndex: 1300,
//     colorPrimary: {
//       backgroundColor: '#fff',
//     },
//   },
// };
// export default MuiAppBar;

// And:
// defaultProps: {
//   elevation: 0,
//   PaperProps: {
//     sx: {
//       border: '1px solid grey',
//       borderRadius: 0,
//       p: 0,
//       '.MuiMenu-list': {
//         p: 0,
//       },
//     },
//   },
// },

// CSS styles (some or all?) could be written the MUI style:
// <Button variant="contained" sx={{height: 40}} />
