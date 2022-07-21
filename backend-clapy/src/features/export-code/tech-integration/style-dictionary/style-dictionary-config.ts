import { Parser } from 'expr-eval';
import type { Formatter } from 'style-dictionary';
import StyleDictionary from 'style-dictionary';
import type { DesignTokens } from 'style-dictionary/types/DesignToken';
import type { FormatterArguments } from 'style-dictionary/types/Format';

import { hexToCSSRgb } from '../../gen-node-utils/utils-and-reset.js';
import type { TokenBoxshadowValue } from './types/types/values';

const { formatHelpers } = StyleDictionary;

export const postTransforms: StyleDictionary.Named<StyleDictionary.Transform>[] = [];

const fontWeightMap = {
  thin: 100,
  extralight: 200,
  ultralight: 200,
  extraleicht: 200,
  light: 300,
  leicht: 300,
  normal: 400,
  regular: 400,
  buch: 400,
  medium: 500,
  kraeftig: 500,
  kräftig: 500,
  semibold: 600,
  demibold: 600,
  halbfett: 600,
  bold: 700,
  dreiviertelfett: 700,
  extrabold: 800,
  ultabold: 800,
  fett: 800,
  black: 900,
  heavy: 900,
  super: 900,
  extrafett: 900,
};

/**
 * Helper: Transforms math like Figma Tokens
 */
const parser = new Parser();

function checkAndEvaluateMath(expr: string) {
  try {
    parser.evaluate(expr);
    return +parser.evaluate(expr).toFixed(3);
  } catch (ex) {
    return expr;
  }
}

/**
 * Helper: Transforms dimensions to px
 */
function transformDimension(value: string) {
  if (value.endsWith('px')) {
    return value;
  }
  return value + 'px';
}

/**
 * Helper: Transforms letter spacing % to em
 */
function transformLetterSpacing(value: string) {
  if (value.endsWith('%')) {
    const percentValue = value.slice(0, -1);
    return `${parseFloat(percentValue) / 100}em`;
  }
  return value;
}

/**
 * Helper: Transforms letter spacing % to em
 */
function transformFontWeights(value: string) {
  const mapped = fontWeightMap[value.toLowerCase() as keyof typeof fontWeightMap];
  return `${mapped}`;
}

/**
 * Helper: Transforms hex rgba colors used in figma tokens: rgba(#ffffff, 0.5) =? rgba(255, 255, 255, 0.5). This is kind of like an alpha() function.
 */
function transformHEXRGBa(value: string) {
  if (value.startsWith('rgba(#')) {
    const [hex, alpha] = value.replace(')', '').split('rgba(').pop()!.split(', ');
    const { r, g, b } = hexToCSSRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } else {
    return value;
  }
}

/**
 * Helper: Transforms boxShadow object to shadow shorthand
 * This currently works fine if every value uses an alias, but if any one of these use a raw value, it will not be transformed.
 */
function transformShadow(shadow: TokenBoxshadowValue) {
  const { x, y, blur, spread, color } = shadow;
  return `${x} ${y} ${blur} ${spread} ${color}`;
}

/**
 * Transform typography shorthands for css variables
 */
postTransforms.push({
  name: 'typography/shorthand',
  type: 'value',
  transitive: true,
  matcher: token => token.type === 'typography',
  transformer: token => {
    const { fontWeight, fontSize, lineHeight, fontFamily } = token.original.value;
    return `${fontWeight} ${fontSize}/${lineHeight} ${fontFamily}`;
  },
});

/**
 * Transform shadow shorthands for css variables
 */
// Doesn't seem to work, incompatible with the current structure as it is processed by Style Dictionary. I post-process it in Clapy instead, when generating the code, i.e. I use multiple variables, one for each part of the shadow rule, instead of a big variable with everything about the shadow.
StyleDictionary.registerTransform({
  name: 'shadow/shorthand',
  type: 'value',
  transitive: true,
  matcher: token => {
    return ['boxShadow'].includes(token.type);
  },
  transformer: token => {
    return Array.isArray(token.original.value)
      ? token.original.value.map(single => transformShadow(single)).join(', ')
      : transformShadow(token.original.value);
  },
});

/**
 * Transform fontSizes to px
 */
postTransforms.push({
  name: 'size/px',
  type: 'value',
  transitive: true,
  matcher: token => {
    return [
      'fontSizes',
      'fontSize',
      'dimension',
      'borderWidth',
      'borderRadius',
      'spacing',
      'sizing',
      'paragraphSpacing',
      'x',
      'y',
      'spread',
      'blur',
    ].includes(token.type);
  },
  transformer: token => {
    return transformDimension(token.value);
  },
});

/**
 * Transform letterSpacing to em
 */
postTransforms.push({
  name: 'size/letterspacing',
  type: 'value',
  transitive: true,
  matcher: token => token.type === 'letterSpacing',
  transformer: token => transformLetterSpacing(token.value),
});

/**
 * Transform fontWeights to numerical
 */
postTransforms.push({
  name: 'type/fontWeight',
  type: 'value',
  transitive: true,
  matcher: token => token.type === 'fontWeights',
  transformer: token => transformFontWeights(token.value),
});

/**
 * Transform rgba colors to usable rgba
 */
postTransforms.push({
  name: 'color/hexrgba',
  type: 'value',
  transitive: true,
  matcher: token => typeof token.value === 'string' && token.value.startsWith('rgba(#'),
  transformer: token => transformHEXRGBa(token.value),
});

/**
 * Transform to resolve math across all tokens
 */
StyleDictionary.registerTransform({
  name: 'resolveMath',
  type: 'value',
  transitive: true,
  matcher: token => {
    return !!token;
  },
  // Putting this in strings seems to be required
  transformer: token => `${checkAndEvaluateMath(token.value)}`,
});

/**
 * Format for css variables
 */
StyleDictionary.registerFormat({
  name: 'css/variables',
  formatter: function ({ dictionary, file, options }) {
    const { outputReferences, theme } = options;
    const { selector } = file as any;
    const sel = `${selector || (theme ? `.${theme}` : '')} `;
    return (
      formatHelpers.fileHeader({ file }) +
      `:root ${sel}{\n` +
      formatHelpers.formattedVariables({ format: 'css', dictionary, outputReferences }) +
      '\n}\n'
    );
  } as Formatter,
});

function convertToVariableIfNeeded(value: string) {
  if (value.startsWith('{') && value.endsWith('}')) {
    return `var(--${value.slice(1, -1).replace('.', '-')})`;
  }
  return value;
}

/**
 * Format for css typography classes
 * This generates theme-independent css classes so we're fine with just using css variables here
 * We're using the css shorthand to define the font: property and define all other values according to the typography token
 */
StyleDictionary.registerFormat({
  name: 'css/typographyClasses',
  formatter: ({ dictionary }: FormatterArguments) =>
    dictionary.allProperties
      .map(
        prop => `
.${prop.name} {
  font: var(--${prop.name});
  letter-spacing: ${convertToVariableIfNeeded(prop.original.value.letterSpacing)};
  text-transform: ${convertToVariableIfNeeded(prop.original.value.textCase)};
  text-decoration: ${convertToVariableIfNeeded(prop.original.value.textDecoration)};
}`,
      )
      .join('\n'),
});

export function getStyleDictionaryConfig(tokens: DesignTokens) {
  return {
    tokens,
    platforms: {
      css: {
        transforms: ['resolveMath', 'shadow/shorthand', 'name/cti/kebab'],
        buildPath: `dist/css/`,
        files: [
          {
            destination: '_variables.css', // Ignored by our implementation
            format: 'css/variables',
          },
        ],
      },
    },
  };
}
