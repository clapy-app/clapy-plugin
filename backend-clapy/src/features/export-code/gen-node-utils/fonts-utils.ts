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
  ['Regular'],
  ['Thin'],
  ['Extra', 'Light'],
  ['Light'],
  ['Semi', 'Light'],
  ['Demi', 'Light'],
  ['Medium'],
  ['Semi', 'Bold'],
  ['Demi', 'Bold'],
  ['Bold'],
  ['Extra', 'Bold'],
  ['Black'],
].map(w => w.join('\\s*').toLowerCase());
const fontWeightRegexFragment = fontWeights.join('|');

const fontStretchs = [
  ['Ultra', 'Condensed'],
  ['Extra', 'Condensed'],
  ['Condensed'],
  ['Semi', 'Condensed'],
  ['Semi', 'Expanded'] /* normal */,
  ['Expanded'],
  ['Extra', 'Expanded'],
  ['Ultra', 'Expanded'],
].map(w => w.join('\\s*').toLowerCase());
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
      (match?.[2]?.replace(/\s*/g, '').toLowerCase() as keyof typeof fontStretchMapFontToCSS | undefined) || 'nostretch'
    ];
  const fontWeight =
    fontWeightMapFontToCSS[
      (match?.[3]?.replace(/\s*/g, '').toLowerCase() as keyof typeof fontWeightMapFontToCSS | undefined) || 'regular'
    ];
  const fontItalicStyle =
    fontItalicStyleMapFontToCSS[
      (match?.[4]?.toLowerCase() as keyof typeof fontItalicStyleMapFontToCSS | undefined) || 'noitalic'
    ];
  return { fontStretch, fontWeight, fontItalicStyle };
}

export function replaceFontWeightWithLabel(fontWeight: number) {
  if (fontWeight === 400) return 'normal';
  if (fontWeight === 700) return 'bold';
  return fontWeight;
}

// font-weight
const fontWeightMapFontToCSS = {
  thin: 100,
  extralight: 200,
  light: 300,
  semilight: 350,
  demilight: 350,
  regular: 400, // 'normal' - default
  medium: 500,
  semibold: 600,
  demibold: 600,
  bold: 700, // 'bold'
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
