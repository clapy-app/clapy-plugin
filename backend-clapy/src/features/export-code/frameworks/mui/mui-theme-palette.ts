import type { Theme } from '@mui/material';
import ts from 'typescript';

import { env } from '../../../../env-and-config/env.js';
import type { Dict } from '../../../sb-serialize-preview/sb-serialize.model.js';
import { figmaColorToCssHex } from '../../gen-node-utils/utils-and-reset.js';

const { factory } = ts;

export type MUIPaletteKV = Partial<{
  [key in keyof Theme['palette']]: keyof Theme['palette'][key] | null;
}>;

// Light/Background/Paper
// Light/Text/Primary
// Light/Error/Main
// Secondary/Main
// Tertiary/Error/Main
// Primary/Light
// Light/Other/Divider
const paletteMappingConfig: Dict<Dict<Dict<MUIPaletteKV>>> = {
  Light: {
    Text: {
      Primary: { text: 'primary' },
      Secondary: { text: 'secondary' },
      Disabled: { text: 'disabled' },
    },
    Primary: {
      Main: { primary: 'main' },
      Dark: { primary: 'dark' },
      Light: { primary: 'light' },
      Contrast: { primary: 'contrastText' },
    },
    Secondary: {
      Main: { secondary: 'main' },
      Dark: { secondary: 'dark' },
      Light: { secondary: 'light' },
      Contrast: { secondary: 'contrastText' },
    },
    Action: {
      'Active (54p)': { action: 'active' },
      'Hover (4p)': { action: 'hover' },
      'Selected (8p)': { action: 'selected' },
      'Disabled (26p)': { action: 'disabled' },
      'Disabled Background (12p)': { action: 'disabledBackground' },
      'Focus (12p)': { action: 'focus' },
    },
    Error: {
      Main: { error: 'main' },
      Dark: { error: 'dark' },
      Light: { error: 'light' },
      Contrast: { error: 'contrastText' },
    },
    Background: {
      // Reflects the background.paper variable from the theme object
      Paper: { background: 'paper' },
      Default: { background: 'default' },
    },
    Other: {
      Divider: { divider: null },
    },
  },
};

// Build mapping
const paletteMapping: Dict<[string, string]> = {};
for (const [k1, val1] of Object.entries(paletteMappingConfig)) {
  for (const [k2, val2] of Object.entries(val1)) {
    for (const [k3, val3] of Object.entries(val2)) {
      paletteMapping[`${k1}/${k2}/${k3}`] = Object.entries(val3)[0] as any;
    }
  }
}

export function mkAstPalette(fillStyles: Dict<PaintStyle>, strokeStyles: Dict<PaintStyle>) {
  const palette = buildPalette(fillStyles, strokeStyles);

  return factory.createObjectLiteralExpression(
    Object.entries(palette).map(([key, palVal]) =>
      factory.createPropertyAssignment(
        factory.createIdentifier(key),
        typeof palVal === 'string'
          ? factory.createStringLiteral(palVal)
          : factory.createObjectLiteralExpression(
              Object.entries(palVal).map(([k2, val2]) =>
                factory.createPropertyAssignment(
                  factory.createIdentifier(k2),
                  factory.createStringLiteral(val2 as string),
                ),
              ),
              false,
            ),
      ),
    ),
    true,
  );
}

function buildPalette(fillStyles: Dict<PaintStyle>, strokeStyles: Dict<PaintStyle>) {
  const colorStyles = [...Object.entries(fillStyles), ...Object.entries(strokeStyles)] as const;
  const palette: Dict<any> = {}; /* as Theme['palette'] */

  for (const [id, style] of colorStyles) {
    const paints = style.paints.filter(paint => paint.type === 'SOLID');
    if (!paints.length) {
      if (!style.paints.length) {
        console.warn('Color style has no paint, skipping:', id, style);
        continue;
      } else {
        console.warn('UNSUPPORTED - Color style has no SOLID paint:', id, style);
        continue;
      }
    }
    if (paints.length > 1) {
      console.warn('UNSUPPORTED - Color style has more than one SOLID paint, only the first one is read:', id, style);
    }
    const paint = style.paints[0];
    if (paint.type !== 'SOLID') {
      console.warn('Impossible, just for type checking', style);
      continue;
    }
    const { color, opacity } = paint;
    const hex = figmaColorToCssHex(color, opacity);
    const styleMapping = paletteMapping[style.name];
    if (!styleMapping) {
      if (env.isDev) {
        console.warn('Style mapping not found for Figma style:', style);
      }
      continue;
    }
    const [k1, k2] = styleMapping;
    if (k2 === null) {
      // Don't go deeper
      if (palette[k1]) {
        console.warn(
          'Theme already has a value for palette',
          k1,
          '- value already in the theme:',
          palette[k1],
          '- value we try to add:',
          hex,
          '-- ignoring the new value.',
        );
        continue;
      }
      palette[k1] = hex;
      continue;
    }
    if (!palette[k1]) {
      (palette as any)[k1] = {};
    }
    const v1 = palette[k1];
    if (v1[k2 as keyof typeof v1]) {
      console.warn(
        'Theme already has a value for palette',
        k1,
        k2,
        '- value already in the theme:',
        palette[k1][k2],
        '- value we try to add:',
        hex,
        '-- ignoring the new value.',
      );
      continue;
    }

    palette[k1][k2] = hex;
  }

  return palette;
}
