import ts from 'typescript';

import { ComponentContext } from '../../code.model';
import { mkAstPalette } from './mui-theme-palette';
import { mkAstTypography } from './mui-theme-typography';

const { factory } = ts;

export function mkThemeVarCreation(lightAppComponentContext: ComponentContext) {
  const { palette, typography } = readThemeStyles(lightAppComponentContext);
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

function readThemeStyles(lightAppComponentContext: ComponentContext) {
  const {
    projectContext: { styles },
  } = lightAppComponentContext;
  const { textStyles, fillStyles, strokeStyles, effectStyles, gridStyles } = styles;

  const palette = mkAstPalette(fillStyles, strokeStyles);
  const typography = mkAstTypography(textStyles);

  return { palette, typography };
}
