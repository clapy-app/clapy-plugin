import ts from 'typescript';

import { ModuleContext, ProjectContext } from '../../code.model';
import { getSetInMap } from '../../figma-code-map/font';
import { mkNamedImportsDeclaration } from '../../gen-node-utils/ts-ast-utils';
import { mkThemeVarCreation } from './mui-theme';

const { factory } = ts;

const addBaseline = false;

export function addMUIFonts(context: ProjectContext) {
  const { fontWeightUsed, enableMUIFramework } = context;
  if (enableMUIFramework) {
    getSetInMap(fontWeightUsed, 'Roboto').add(300).add(400).add(500).add(700);
  }
}

export function addMUIProvidersImports(lightAppModuleContext: ModuleContext) {
  if (lightAppModuleContext.projectContext.enableMUIFramework) {
    const { imports, statements } = lightAppModuleContext;
    const namedImports = ['createTheme', 'ThemeProvider'];
    if (addBaseline) {
      namedImports.push('CssBaseline');
    }
    imports['@mui/material'] = mkNamedImportsDeclaration(namedImports, '@mui/material');

    statements.push(mkThemeVarCreation(lightAppModuleContext));
  }
}

export function addMUIProviders<TNode extends ts.JsxChild>(
  context: ModuleContext,
  rootJsx: TNode,
): TNode | ts.JsxElement {
  const { projectContext } = context;
  const { enableMUIFramework } = projectContext;
  if (!enableMUIFramework) return rootJsx;
  return wrapWithFragmentAndBaseline(rootJsx);
}

function wrapWithFragmentAndBaseline<TNode extends ts.JsxChild>(jsx: TNode) {
  return factory.createJsxElement(
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
