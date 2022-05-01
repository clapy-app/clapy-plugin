import { TypographyStyle, TypographyVariant } from '@mui/material';
import { Variant } from '@mui/material/styles/createTypography';
import ts from 'typescript';

import { Dict } from '../../../sb-serialize-preview/sb-serialize.model';
import { figmaTypoToJss } from '../../figma-code-map/font';

const { factory } = ts;

export const typoMappingConfig: Dict<Dict<TypographyVariant>> = {
  Typography: {
    H1: 'h1',
    H2: 'h2',
    H3: 'h3',
    H4: 'h4',
    H5: 'h5',
    H6: 'h6',
    'Body 1': 'body1',
    'Body 2': 'body2',
    'Subtitle 1': 'subtitle1',
    'Subtitle 2': 'subtitle2',
    Overline: 'overline',
    Caption: 'caption',
  },
};

type Typo2 = Record<Variant, TypographyStyle> /* Theme['typography'] */;

// Build mapping
const typoMapping: Dict<TypographyVariant> = {};
for (const [k1, val1] of Object.entries(typoMappingConfig)) {
  for (const [k2, val2] of Object.entries(val1)) {
    typoMapping[`${k1}/${k2}`] = val2;
  }
}

export function mkAstTypography(textStyles: Dict<TextStyle>) {
  const typography = buildTypography(textStyles);

  return factory.createObjectLiteralExpression(
    Object.entries(typography).map(([key, palVal]) =>
      factory.createPropertyAssignment(
        factory.createIdentifier(key),
        factory.createObjectLiteralExpression(
          Object.entries(palVal).map(([k2, val2]) =>
            factory.createPropertyAssignment(
              factory.createIdentifier(k2),
              typeof val2 === 'number'
                ? factory.createNumericLiteral(val2)
                : factory.createStringLiteral((val2 as any).toString()),
            ),
          ),
          false,
        ),
      ),
    ),
    true,
  );
}

function buildTypography(textStyles: Dict<TextStyle>) {
  const typography = {} as Typo2;

  for (const [id, style] of Object.entries(textStyles)) {
    const { name } = style;
    const key = typoMapping[name];
    if (key) {
      const jss = figmaTypoToJss(style);
      typography[key] = jss;
    }
  }

  return typography;
}
