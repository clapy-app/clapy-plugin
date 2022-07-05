import ts from 'typescript';

import type { ModuleContext } from '../../code.model.js';
import { mkAstPalette } from './mui-theme-palette.js';
import { mkAstTypography } from './mui-theme-typography.js';

const { factory } = ts;

export function mkThemeVarCreation(lightAppModuleContext: ModuleContext) {
  const { palette, typography } = readThemeStyles(lightAppModuleContext);
  return factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier('theme'),
          undefined,
          undefined,
          factory.createCallExpression(factory.createIdentifier('createTheme'), undefined, [
            factory.createObjectLiteralExpression(
              [
                factory.createPropertyAssignment(factory.createIdentifier('palette'), palette),
                factory.createPropertyAssignment(factory.createIdentifier('typography'), typography),
              ],
              false,
            ),
          ]),
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );
}

function readThemeStyles(lightAppModuleContext: ModuleContext) {
  const {
    projectContext: { styles },
  } = lightAppModuleContext;
  const { textStyles, fillStyles, strokeStyles, effectStyles, gridStyles } = styles;

  const palette = mkAstPalette(fillStyles, strokeStyles);
  const typography = mkAstTypography(textStyles);

  return { palette, typography };
}
