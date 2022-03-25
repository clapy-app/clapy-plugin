// Extracted from Figma typings
type RangeProp = keyof Omit<StyledTextSegment, 'characters' | 'start' | 'end'>;
// type TextSegment = Pick<StyledTextSegment, RangeProp[number] | 'characters' | 'start' | 'end'>
// => StyledTextSegment

export const rangeProps: RangeProp[] = [
  'fillStyleId',
  'fills',
  'fontName',
  'fontSize',
  'hyperlink',
  'indentation',
  'letterSpacing',
  'lineHeight',
  'listOptions',
  'textCase',
  'textDecoration',
  'textStyleId',
];

const fontWeights = [
  'Regular',
  'Thin',
  'ExtraLight',
  'Light',
  'SemiLight',
  'DemiLight',
  'Medium',
  'SemiBold',
  'Bold',
  'ExtraBold',
  'Black',
].map(w => w.toLowerCase());
const fontWeightRegexFragment = fontWeights.join('|');

const fontStretchs = [
  'UltraCondensed',
  'ExtraCondensed',
  'Condensed',
  'SemiCondensed',
  /* (normal) ,*/ 'SemiExpanded',
  'Expanded',
  'ExtraExpanded',
  'UltraExpanded',
].map(w => w.toLowerCase());
const fontStretchsRegexFragment = fontStretchs.join('|');

const fontItalicStyles = ['Italic', 'Oblique'].map(w => w.toLowerCase());
const fontItalicStyleRegexFragment = fontItalicStyles.join('|');

const fontStyleRegex = new RegExp(
  `(Display)?\\s?(${fontStretchsRegexFragment})?\\s*(${fontWeightRegexFragment})?\\s*(${fontItalicStyleRegexFragment})?`,
  'i',
);

export function parseFontStyle(style: string) {
  const match = style.match(fontStyleRegex);
  const fontStretch =
    fontStretchMapFontToCSS[
      (match?.[2]?.toLowerCase() as keyof typeof fontStretchMapFontToCSS | undefined) || 'nostretch'
    ];
  const fontWeight =
    fontWeightMapFontToCSS[(match?.[3]?.toLowerCase() as keyof typeof fontWeightMapFontToCSS | undefined) || 'regular'];
  const fontItalicStyle =
    fontItalicStyleMapFontToCSS[
      (match?.[4]?.toLowerCase() as keyof typeof fontItalicStyleMapFontToCSS | undefined) || 'noitalic'
    ];
  return { fontStretch, fontWeight, fontItalicStyle };
}

// font-weight
const fontWeightMapFontToCSS = {
  thin: 100,
  extralight: 200,
  light: 300,
  semilight: 350,
  demilight: 350,
  regular: 'normal' /* 400 */, // default
  medium: 500,
  semibold: 600,
  bold: 'bold' /* 700 */,
  extrabold: 800,
  black: 900,
} as const;

// font-stretch => UltraCondensed, ExtraCondensed, Condensed, SemiCondensed, (normal), SemiExpanded, Expanded, ExtraExpanded, UltraExpanded
// https://developer.mozilla.org/fr/docs/Web/CSS/font-stretch
const fontStretchMapFontToCSS = {
  // in %
  // ultracondensed: 50,
  // extracondensed: 62.5,
  // condensed: 75,
  // semicondensed: 87.5,
  // nostretch: 100, // Default
  // semiexpanded: 112.5,
  // expanded: 125,
  // extraexpanded: 150,
  // ultraexpanded: 200,

  // For style rules, we have this equivalence:
  ultracondensed: 'ultra-condensed',
  extracondensed: 'extra-condensed',
  condensed: 'condensed',
  semicondensed: 'semi-condensed',
  nostretch: 'normal', // Default
  semiexpanded: 'semi-expanded',
  expanded: 'expanded',
  extraexpanded: 'extra-expanded',
  ultraexpanded: 'ultra-expanded',
} as const;

// font-style
const fontItalicStyleMapFontToCSS = {
  noitalic: 'normal', // Default
  italic: 'italic',
  oblique: 'oblique',
} as const;
