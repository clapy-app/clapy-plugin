import { unquoteAndTrimString } from '../../../common/general-utils';
import { Property } from '../../../common/sb-serialize.model';
import { sizeWithUnitToPx } from './update-canvas-utils';

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

interface FontIndexValue {
  systemFontStyle: string;
  fontStretch: number;
  fontWeight: number;
  fontStyle: Property.FontStyle;
}

export declare type UnwrapPromiseLike<T> = T extends PromiseLike<infer U> ? U : T;
type FontsIndexPromise = ReturnType<typeof indexFonts>;
type FontsIndex = UnwrapPromiseLike<FontsIndexPromise>;
let fontsIndexPromise: FontsIndexPromise | undefined = undefined;

async function getFontsIndex() {
  if (!fontsIndexPromise) {
    fontsIndexPromise = indexFonts();
  }
  return fontsIndexPromise;
}

async function indexFonts() {
  const fontsList = await figma.listAvailableFontsAsync();
  const fontsIndex = new Map<string, FontIndexValue[]>();
  for (const { fontName } of fontsList) {
    const { family, style } = fontName;
    const match = style.match(fontStyleRegex);
    const fontStretch =
      fontStretchMapFontToCSS[
        (match?.[2]?.toLowerCase() as keyof typeof fontStretchMapFontToCSS | undefined) || 'nostretch'
      ];
    const fontWeight =
      fontWeightMapFontToCSS[
        (match?.[3]?.toLowerCase() as keyof typeof fontWeightMapFontToCSS | undefined) || 'regular'
      ];
    const fontItalicStyle =
      fontItalicStyleMapFontToCSS[
        (match?.[4]?.toLowerCase() as keyof typeof fontItalicStyleMapFontToCSS | undefined) || 'noitalic'
      ];
    let fontStyles = fontsIndex.get(family);
    if (!fontStyles) {
      fontStyles = [];
      fontsIndex.set(family, fontStyles);
    }
    fontStyles.push({ systemFontStyle: style, fontStretch, fontWeight, fontStyle: fontItalicStyle });
  }

  return fontsIndex;
}

export async function cssToFontStyle(
  fontFamilies: Property.FontFamily,
  fontStretch: Property.FontStretch,
  fontWeight: Property.FontWeight,
  fontStyle: Property.FontStyle,
) {
  const fontsIndex = await getFontsIndex();
  const fontFamily = getFirstFontFamilyAvailable(fontFamilies, fontsIndex);
  if (!fontFamily) return undefined;

  const fontVariants = fontsIndex.get(fontFamily);
  if (!fontVariants) return undefined;

  const fontStretchN = sizeWithUnitToPx(fontStretch);
  const fontWeightN = sizeWithUnitToPx(fontWeight);
  let selectedFontVariant: FontIndexValue | undefined = undefined;

  for (const fontVariant of fontVariants) {
    if (!selectedFontVariant) {
      // First iteration
      selectedFontVariant = fontVariant;
      continue;
    }

    // Exact match, the perfect case: let's select it and stop looping.
    if (
      fontVariant.fontStretch === fontStretchN &&
      fontVariant.fontWeight === fontWeightN &&
      fontVariant.fontStyle === fontStyle
    ) {
      selectedFontVariant = fontVariant;
      break; // Break instead of continue, it's already the perfect match.
    }

    // Italic / oblique style has higher priority. We get closer, let's use the font.
    if (isFontStyleCloser(fontStyle, selectedFontVariant.fontStyle, fontVariant.fontStyle)) {
      selectedFontVariant = fontVariant;
      continue;
    }

    // weight is the next level of priority.
    if (isFontWeightCloser(fontWeightN, selectedFontVariant.fontWeight, fontVariant.fontWeight)) {
      selectedFontVariant = fontVariant;
      continue;
    }

    // stretch is the next level of priority.
    if (isFontStretchCloser(fontStretchN, selectedFontVariant.fontStretch, fontVariant.fontStretch)) {
      selectedFontVariant = fontVariant;
      continue;
    }
  }

  if (!selectedFontVariant) {
    return undefined;
  }
  const fontName: FontName = {
    family: fontFamily,
    style: selectedFontVariant.systemFontStyle,
  };
  return fontName;
}

function getFirstFontFamilyAvailable(fontFamilies: Property.FontFamily, fontsIndex: FontsIndex) {
  // Example of value for fontFamilies:
  // system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
  for (const family of fontFamilies.split(',').map(unquoteAndTrimString)) {
    if (fontsIndex.has(family)) {
      return family;
    }
  }
}

function checkItalicOrOblique(fontStyle: Property.FontStyle) {
  return fontStyle === 'italic' || fontStyle.startsWith('oblique');
}

function isFontStyleCloser(
  desiredFontStyle: Property.FontStyle,
  previousFontStyle: Property.FontStyle,
  currentFontStyle: Property.FontStyle,
) {
  if (currentFontStyle === desiredFontStyle && previousFontStyle !== desiredFontStyle) {
    return true;
  }
  const desiredIsItalicOrOblique = checkItalicOrOblique(desiredFontStyle);
  if (
    checkItalicOrOblique(currentFontStyle) === desiredIsItalicOrOblique &&
    checkItalicOrOblique(previousFontStyle) !== desiredIsItalicOrOblique
  ) {
    return true;
  }

  return false;
}

function isFontWeightCloser(desiredFontWeight: number, previousFontWeight: number, currentFontWeight: number) {
  const dCurrent = getFontWeightDistance(desiredFontWeight, currentFontWeight);
  const dPrevious = getFontWeightDistance(desiredFontWeight, previousFontWeight);
  // In case of same distance, prefer the higher value.
  return dCurrent < dPrevious ? true : dCurrent === dPrevious ? currentFontWeight > previousFontWeight : false;
}

function getFontWeightDistance(userWeight: number, availableWeight: number) {
  if (availableWeight === userWeight) {
    return 0;
  }

  return Math.abs(userWeight - availableWeight);

  // Algorithm described on https://developer.mozilla.org/fr/docs/Web/CSS/font-weight#conversion_des_valeurs,
  // but it doesn't seem to be the one followed by Chrome. We use the simpler version above that seems to match.
}

function isFontStretchCloser(desiredFontStretch: number, previousFontStretch: number, currentFontStretch: number) {
  const dCurrent = getFontStretchDistance(desiredFontStretch, currentFontStretch);
  const dPrevious = getFontStretchDistance(desiredFontStretch, previousFontStretch);
  // In case of same distance, prefer the higher value.
  return dCurrent < dPrevious ? true : dCurrent === dPrevious ? currentFontStretch > previousFontStretch : false;
}

function getFontStretchDistance(userStretch: number, availableStretch: number) {
  if (availableStretch === userStretch) {
    return 0;
  }

  return Math.abs(userStretch - availableStretch);

  // Algorithm described by https://developer.mozilla.org/fr/docs/Web/CSS/font-stretch#s%C3%A9lection_de_la_fonte
  // But given the difference for font weight, let's simplify and use the formula above that's more likely to be used by Chrome.
}

// font-weight
const fontWeightMapFontToCSS = {
  thin: 100,
  extralight: 200,
  light: 300,
  semilight: 350,
  demilight: 350,
  regular: 400, // default
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

// font-stretch => UltraCondensed, ExtraCondensed, Condensed, SemiCondensed, (normal), SemiExpanded, Expanded, ExtraExpanded, UltraExpanded
// https://developer.mozilla.org/fr/docs/Web/CSS/font-stretch
const fontStretchMapFontToCSS = {
  // in %
  ultracondensed: 50,
  extracondensed: 62.5,
  condensed: 75,
  semicondensed: 87.5,
  nostretch: 100, // Default
  semiexpanded: 112.5,
  expanded: 125,
  extraexpanded: 150,
  ultraexpanded: 200,

  // For style rules, we have this equivalence:
  // 'ultracondensed': 'ultra-condensed',
  // 'extracondensed': 'extra-condensed',
  // 'condensed': 'condensed',
  // 'semicondensed': 'semi-condensed',
  // nostretch: 'normal', // Default
  // 'semiexpanded': 'semi-expanded',
  // 'expanded': 'expanded',
  // 'extraexpanded': 'extra-expanded',
  // 'ultraexpanded': 'ultra-expanded',
};

// font-style
const fontItalicStyleMapFontToCSS = {
  noitalic: 'normal', // Default
  italic: 'italic',
  oblique: 'oblique',
};

// Stats listing the font styles used on AOL computer with the number of occurrences of each among the fonts

// "Regular": 1350,
// "Bold": 543,
// "Light": 324,
// "Medium": 307,
// "SemiBold": 290,
// "Italic": 244,
// "ExtraBold": 206,
// "Bold Italic": 199,
// "ExtraLight": 193,
// "Black": 185,
// "Thin": 161,
// "Light Italic": 123,
// "Medium Italic": 113,
// "SemiBold Italic": 112,
// "ExtraLight Italic": 77,
// "ExtraBold Italic": 75,
// "Black Italic": 72,
// "Thin Italic": 60,
// "Condensed": 26,
// "SemiCondensed": 26,
// "Condensed Bold": 26,
// "Condensed ExtraBold": 26,
// "Condensed Light": 26,
// "Condensed Black": 25,
// "Condensed ExtraLight": 25,
// "Condensed Medium": 25,
// "Condensed Thin": 24,
// "SemiCondensed Black": 24,
// "SemiCondensed Bold": 24,
// "SemiCondensed ExtraBold": 24,
// "SemiCondensed ExtraLight": 24,
// "SemiCondensed Light": 24,
// "SemiCondensed Medium": 24,
// "SemiCondensed SemiBold": 24,
// "ExtraCondensed": 24,
// "Condensed SemiBold": 23,
// "SemiCondensed Thin": 23,
// "ExtraCondensed Thin": 22,
// "ExtraCondensed Black": 22,
// "ExtraCondensed Bold": 22,
// "ExtraCondensed ExtraBold": 22,
// "ExtraCondensed ExtraLight": 22,
// "ExtraCondensed Light": 22,
// "ExtraCondensed Medium": 22,
// "ExtraCondensed SemiBold": 22,
// "Book": 9,
// "Condensed Regular": 5,
// "Semilight": 5,
// "DemiLight": 5,
// "Semibold": 4,
// "Condensed Italic": 4,
// "SemiLight": 3,
// "Oblique": 3,
// "Expanded Black": 3,
// "Expanded Bold": 3,
// "Expanded ExtraBold": 3,
// "Expanded ExtraLight": 3,
// "Expanded Light": 3,
// "Expanded Medium": 3,
// "Expanded Regular": 3,
// "Expanded SemiBold": 3,
// "SemiCondensed Regular": 3,
// "SemiExpanded Black": 3,
// "SemiExpanded Bold": 3,
// "SemiExpanded ExtraBold": 3,
// "SemiExpanded ExtraLight": 3,
// "SemiExpanded Light": 3,
// "SemiExpanded Medium": 3,
// "SemiExpanded Regular": 3,
// "SemiExpanded SemiBold": 3,
// "Extra Bold": 3,
// "Extra Bold Italic": 3,
// "BoldItalic": 3,
// "Semibold Italic": 3,
// "Condensed Bold Italic": 3,
// "Condensed ExtraBold Italic": 3,
// "Condensed Light Italic": 3,
// "Condensed SemiBold Italic": 3,
// "Display Bold": 3,
// "Condensed SemiBold ": 3,
// "ExtraBlack": 2,
// "SemiLight Italic": 2,
// "Expanded Thin": 2,
// "SemiExpanded Thin": 2,
// "ExtraCondensed Thin Italic": 2,
// "SemiExpanded": 2,
// "SemiCondensed Italic": 2,
// "Heavy": 2,
// "Extrabold": 2,
// "Condensed Black Italic": 2,
// "Condensed ExtraLight Italic": 2,
// "Condensed Medium Italic": 2,
// "Condensed Thin Italic": 2,
// "Display Black": 2,
// "Display Bold Italic": 2,
// "Display Condensed": 2,
// "Display Condensed Black": 2,
// "Display Condensed Bold": 2,
// "Display Condensed ExtraBold": 2,
// "Display Condensed ExtraLight": 2,
// "Display Condensed Light": 2,
// "Display Condensed Medium": 2,
// "Display Condensed SemiBold": 2,
// "Display Condensed Thin": 2,
// "Display ExtraBold": 2,
// "Display ExtraCondensed": 2,
// "Display ExtraCondensed Black": 2,
// "Display ExtraCondensed Bold": 2,
// "Display ExtraCondensed ExtraBold": 2,
// "Display ExtraCondensed ExtraLight": 2,
// "Display ExtraCondensed Light": 2,
// "Display ExtraCondensed Medium": 2,
// "Display ExtraCondensed SemiBold": 2,
// "Display ExtraCondensed Thin": 2,
// "Display ExtraLight": 2,
// "Display Italic": 2,
// "Display Light": 2,
// "Display Medium": 2,
// "Display Regular": 2,
// "Display SemiBold": 2,
// "Display SemiCondensed": 2,
// "Display SemiCondensed Black": 2,
// "Display SemiCondensed Bold": 2,
// "Display SemiCondensed ExtraBold": 2,
// "Display SemiCondensed ExtraLight": 2,
// "Display SemiCondensed Light": 2,
// "Display SemiCondensed Medium": 2,
// "Display SemiCondensed SemiBold": 2,
// "Display SemiCondensed Thin": 2,
// "Display Thin": 2,
// "B": 2,
// "EB": 2,
// "L": 2,
// "M": 2,
// "??": 1,
// "Default": 1,
// "Bold Condensed": 1,
// "Bold SemiCondensed": 1,
// "Light Condensed": 1,
// "Light SemiCondensed": 1,
// "SemiBold Condensed": 1,
// "SemiBold SemiCondensed": 1,
// "SemiLight Condensed": 1,
// "SemiLight SemiCondensed": 1,
// "BoldOblique": 1,
// "Regular24": 1,
// "Retina": 1,
// "One": 1,
// "Solid": 1,
// "Hairline": 1,
// "Expanded": 1,
// "ExtraCondensed Regular": 1,
// "ExtraExpanded": 1,
// "ExtraExpanded Black": 1,
// "ExtraExpanded Bold": 1,
// "ExtraExpanded ExtraBold": 1,
// "ExtraExpanded ExtraLight": 1,
// "ExtraExpanded Light": 1,
// "ExtraExpanded Medium": 1,
// "ExtraExpanded Regular": 1,
// "ExtraExpanded SemiBold": 1,
// "UltraCondensed": 1,
// "UltraCondensed Black": 1,
// "UltraCondensed Bold": 1,
// "UltraCondensed ExtraBold": 1,
// "UltraCondensed ExtraLight": 1,
// "UltraCondensed Light": 1,
// "UltraCondensed Medium": 1,
// "UltraCondensed Regular": 1,
// "UltraCondensed SemiBold": 1,
// "UltraExpanded": 1,
// "UltraExpanded Black": 1,
// "UltraExpanded Bold": 1,
// "UltraExpanded ExtraBold": 1,
// "UltraExpanded ExtraLight": 1,
// "UltraExpanded Light": 1,
// "UltraExpanded Medium": 1,
// "UltraExpanded Regular": 1,
// "UltraExpanded SemiBold": 1,
// "Extra Light": 1,
// "Extra Light Italic": 1,
// "Semi Bold": 1,
// "Semi Bold Italic": 1,
// "SemiExpanded Italic": 1,
// "League Script": 1,
// "DemiBold": 1,
// "UltraLight": 1,
// "ExtraBlack Italic": 1,
// "Display Black Italic": 1,
// "Display Condensed Black Italic": 1,
// "Display Condensed Bold Italic": 1,
// "Display Condensed ExtraBold Italic": 1,
// "Display Condensed ExtraLight Italic": 1,
// "Display Condensed Italic": 1,
// "Display Condensed Light Italic": 1,
// "Display Condensed Medium Italic": 1,
// "Display Condensed SemiBold Italic": 1,
// "Display Condensed Thin Italic": 1,
// "Display ExtraBold Italic": 1,
// "Display ExtraCondensed Black Italic": 1,
// "Display ExtraCondensed Bold Italic": 1,
// "Display ExtraCondensed ExtraBold Italic": 1,
// "Display ExtraCondensed ExtraLight Italic": 1,
// "Display ExtraCondensed Italic": 1,
// "Display ExtraCondensed Light Italic": 1,
// "Display ExtraCondensed Medium Italic": 1,
// "Display ExtraCondensed SemiBold Italic": 1,
// "Display ExtraCondensed Thin Italic": 1,
// "Display ExtraLight Italic": 1,
// "Display Light Italic": 1,
// "Display Medium Italic": 1,
// "Display SemiBold Italic": 1,
// "Display SemiCondensed Black Italic": 1,
// "Display SemiCondensed Bold Italic": 1,
// "Display SemiCondensed ExtraBold Italic": 1,
// "Display SemiCondensed ExtraLight Italic": 1,
// "Display SemiCondensed Italic": 1,
// "Display SemiCondensed Light Italic": 1,
// "Display SemiCondensed Medium Italic": 1,
// "Display SemiCondensed SemiBold Italic": 1,
// "Display SemiCondensed Thin Italic": 1,
// "Display Thin Italic": 1,
// "ExtraCondensed Black Italic": 1,
// "ExtraCondensed Bold Italic": 1,
// "ExtraCondensed ExtraBold Italic": 1,
// "ExtraCondensed ExtraLight Italic": 1,
// "ExtraCondensed Italic": 1,
// "ExtraCondensed Light Italic": 1,
// "ExtraCondensed Medium Italic": 1,
// "ExtraCondensed SemiBold Italic": 1,
// "SemiCondensed Black Italic": 1,
// "SemiCondensed Bold Italic": 1,
// "SemiCondensed ExtraBold Italic": 1,
// "SemiCondensed ExtraLight Italic": 1,
// "SemiCondensed Light Italic": 1,
// "SemiCondensed Medium Italic": 1,
// "SemiCondensed SemiBold Italic": 1,
// "SemiCondensed Thin Italic": 1,
// "Block": 1,
// "Mono Casual": 1,
// "Mono Casual Black": 1,
// "Mono Casual Black Italic": 1,
// "Mono Casual Bold": 1,
// "Mono Casual Bold Italic": 1,
// "Mono Casual ExtraBlack": 1,
// "Mono Casual ExtraBlack Italic": 1,
// "Mono Casual ExtraBold": 1,
// "Mono Casual ExtraBold Italic": 1,
// "Mono Casual Italic": 1,
// "Mono Casual Light": 1,
// "Mono Casual Light Italic": 1,
// "Mono Casual Medium": 1,
// "Mono Casual Medium Italic": 1,
// "Mono Casual SemiBold": 1,
// "Mono Casual SemiBold Italic": 1,
// "Mono Linear": 1,
// "Mono Linear Black": 1,
// "Mono Linear Black Italic": 1,
// "Mono Linear Bold": 1,
// "Mono Linear Bold Italic": 1,
// "Mono Linear ExtraBlack": 1,
// "Mono Linear ExtraBlack Italic": 1,
// "Mono Linear ExtraBold": 1,
// "Mono Linear ExtraBold Italic": 1,
// "Mono Linear Italic": 1,
// "Mono Linear Light": 1,
// "Mono Linear Light Italic": 1,
// "Mono Linear Medium": 1,
// "Mono Linear Medium Italic": 1,
// "Mono Linear SemiBold": 1,
// "Mono Linear SemiBold Italic": 1,
// "Sans Casual": 1,
// "Sans Casual Black": 1,
// "Sans Casual Black Italic": 1,
// "Sans Casual Bold": 1,
// "Sans Casual Bold Italic": 1,
// "Sans Casual ExtraBlack": 1,
// "Sans Casual ExtraBlack Italic": 1,
// "Sans Casual ExtraBold": 1,
// "Sans Casual ExtraBold Italic": 1,
// "Sans Casual Italic": 1,
// "Sans Casual Light": 1,
// "Sans Casual Light Italic": 1,
// "Sans Casual Medium": 1,
// "Sans Casual Medium Italic": 1,
// "Sans Casual SemiBold": 1,
// "Sans Casual SemiBold Italic": 1,
// "Sans Linear": 1,
// "Sans Linear Black": 1,
// "Sans Linear Black Italic": 1,
// "Sans Linear Bold": 1,
// "Sans Linear Bold Italic": 1,
// "Sans Linear ExtraBlack": 1,
// "Sans Linear ExtraBlack Italic": 1,
// "Sans Linear ExtraBold": 1,
// "Sans Linear ExtraBold Italic": 1,
// "Sans Linear Italic": 1,
// "Sans Linear Light": 1,
// "Sans Linear Light Italic": 1,
// "Sans Linear Medium": 1,
// "Sans Linear Medium Italic": 1,
// "Sans Linear SemiBold": 1,
// "Sans Linear SemiBold Italic": 1,
// "Semilight Italic": 1,
// "vert": 1,
// "Banner": 1,
// "Banner Bold": 1,
// "Banner Bold Italic": 1,
// "Banner Italic": 1,
// "Display": 1,
// "Heading": 1,
// "Heading Bold": 1,
// "Heading Bold Italic": 1,
// "Heading Italic": 1,
// "Small": 1,
// "Small Bold": 1,
// "Small Bold Italic": 1,
// "Small Italic": 1,
// "Subheading": 1,
// "Subheading Bold": 1,
// "Subheading Bold Italic": 1,
// "Subheading Italic": 1,
// "Text": 1,
// "Text Bold": 1,
// "Text Bold Italic": 1,
// "Text Italic": 1,
// "Bold Oblique": 1,
// "MagerKursiv": 1,
// "cmbx10": 1,
// "cmex10": 1,
// "cmmi10": 1,
// "cmr10": 1,
// "cmsy10": 1,
// "cmti10": 1
