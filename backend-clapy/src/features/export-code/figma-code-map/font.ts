import { TypographyStyle } from '@mui/material';
import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext, ProjectContext } from '../code.model';
import { indexHtmlPath } from '../create-ts-compiler/load-file-utils-and-paths';
import { addJss, addStyle } from '../css-gen/css-factories-high';
import { addMUIFonts } from '../frameworks/mui/mui-add-globals';
import { parseFontStyle, replaceFontWeightWithLabel } from './details/fonts-utils';

// Duplicate of below function with slight changes.
// Always update both or refactor to centralize.
export function figmaTypoToJss(figmaStyle: TextStyle) {
  const { fontSize, fontName, letterSpacing, lineHeight, textCase, textDecoration, paragraphIndent, paragraphSpacing } =
    figmaStyle;
  const styles: Partial<TypographyStyle> = {};

  addJss(styles, 'fontSize', fontSize);

  if (lineHeight.unit !== 'AUTO') {
    addJss(styles, 'lineHeight', [lineHeight.value, lineHeight.unit === 'PERCENT' ? '%' : 'px']);
  }

  const { family, style } = fontName;
  const { fontWeight, fontStretch, fontItalicStyle } = parseFontStyle(style);
  if (fontWeight !== 400) {
    addJss(styles, 'fontWeight', replaceFontWeightWithLabel(fontWeight));
  }
  if (fontStretch !== 'normal') {
    addJss(styles, 'fontStretch', fontStretch);
  }
  if (fontItalicStyle !== 'normal') {
    addJss(styles, 'fontStyle', fontItalicStyle);
  }

  addJss(styles, 'fontFamily', ...mkFamiliesValues(family));

  if (letterSpacing.value !== 0) {
    if (letterSpacing.unit === 'PERCENT') {
      addJss(styles, 'letterSpacing', [letterSpacing.value / 100, 'em']);
    } else {
      addJss(styles, 'letterSpacing', [letterSpacing.value, 'px']);
    }
  }

  if (textCase !== 'ORIGINAL') {
    addJss(
      styles,
      'textTransform',
      textCase === 'UPPER' ? 'uppercase' : textCase === 'LOWER' ? 'lowercase' : 'capitalize',
    );
  }

  if (textDecoration !== 'NONE') {
    addJss(styles, 'textDecoration', textDecoration === 'STRIKETHROUGH' ? 'line-through' : 'underline');
  }
  return styles;
}

export function fontFigmaToCode(context: NodeContext, textSegment: StyledTextSegment, styles: Dict<DeclarationPlain>) {
  const {
    moduleContext: {
      projectContext: { fontWeightUsed },
    },
  } = context;
  const { fontSize, fontName, letterSpacing, lineHeight, textCase, textDecoration } = textSegment;

  addStyle(context, textSegment, styles, 'font-size', [fontSize, 'px']);

  if (lineHeight.unit !== 'AUTO') {
    addStyle(context, textSegment, styles, 'line-height', [
      lineHeight.value,
      lineHeight.unit === 'PERCENT' ? '%' : 'px',
    ]);
  }

  const { family, style } = fontName;
  const { fontWeight, fontStretch, fontItalicStyle } = parseFontStyle(style);
  if (fontWeight !== 400) {
    addStyle(context, textSegment, styles, 'font-weight', replaceFontWeightWithLabel(fontWeight));
  }
  if (fontStretch !== 'normal') {
    addStyle(context, textSegment, styles, 'font-stretch', fontStretch);
  }
  if (fontItalicStyle !== 'normal') {
    addStyle(context, textSegment, styles, 'font-style', fontItalicStyle);
  }

  // Add font weight used, mapped to the family, to build the google fonts URL at the end
  getSetInMap(fontWeightUsed, family).add(fontWeight);

  addStyle(context, textSegment, styles, 'font-family', ...mkFamiliesValues(family));

  if (letterSpacing.value !== 0) {
    if (letterSpacing.unit === 'PERCENT') {
      addStyle(context, textSegment, styles, 'letter-spacing', [letterSpacing.value / 100, 'em']);
    } else {
      addStyle(context, textSegment, styles, 'letter-spacing', [letterSpacing.value, 'px']);
    }
  }

  if (textCase !== 'ORIGINAL') {
    addStyle(
      context,
      textSegment,
      styles,
      'text-transform',
      textCase === 'UPPER' ? 'uppercase' : textCase === 'LOWER' ? 'lowercase' : 'capitalize',
    );
  }

  if (textDecoration !== 'NONE') {
    addStyle(
      context,
      textSegment,
      styles,
      'text-decoration',
      textDecoration === 'STRIKETHROUGH' ? 'line-through' : 'underline',
    );
  }
}

/**
 * Return the Set found in the map at the given key. If there is no set for this key, it is created, added to the map and returned.
 */
export function getSetInMap<MapKey, SetValue>(map: Map<MapKey, Set<SetValue>>, key: MapKey) {
  let set = map.get(key);
  if (!set) {
    set = new Set();
    map.set(key, set);
  }
  return set;
}

function mkFamiliesValues(family: string) {
  return [
    family,
    ',',
    'system-ui',
    ',',
    '-apple-system',
    ',',
    '"Segoe UI"',
    ',',
    'Roboto',
    ',',
    '"Helvetica Neue"',
    ',',
    'Arial',
    ',',
    '"Noto Sans"',
    ',',
    '"Liberation Sans"',
    ',',
    'sans-serif',
  ];
}

export function addFontsToIndexHtml(projectContext: ProjectContext) {
  const { fontWeightUsed, resources } = projectContext;
  addMUIFonts(projectContext);
  if (fontWeightUsed.size) {
    const familyUrlFragment = Array.from(fontWeightUsed.entries())
      .map(([familyName, weightSet]) => {
        let weightFragment;
        const weightValues = Array.from(weightSet);
        if (!weightSet.size || (weightSet.size === 1 && weightValues[0] === 400)) {
          weightFragment = '';
        } else {
          weightFragment = `:wght@${weightValues.sort().join(';')}`;
        }
        return `family=${encodeURIComponent(familyName)}${weightFragment}`;
      })
      .join('&');
    resources[indexHtmlPath] = resources[indexHtmlPath].replace(
      '</head>',
      // `  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n`
      `  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?${familyUrlFragment}&display=swap">\n</head>`,
    );
  }
}
