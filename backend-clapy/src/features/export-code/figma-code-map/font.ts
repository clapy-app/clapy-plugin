import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { CodeContext } from '../code.model';
import { addStyle } from '../css-gen/css-factories-high';
import { parseFontStyle } from './details/fonts-utils';
import { warnNode } from './details/utils-and-reset';

export function fontFigmaToCode(context: CodeContext, textSegment: StyledTextSegment, styles: Dict<DeclarationPlain>) {
  const { fontSize, fontName, letterSpacing, lineHeight, textCase, textDecoration } = textSegment;

  addStyle(styles, 'font-size', [fontSize, 'px']);

  if (lineHeight.unit !== 'AUTO') {
    addStyle(styles, 'line-height', [lineHeight.value, lineHeight.unit === 'PERCENT' ? '%' : 'px']);
  }

  const { family, style } = fontName;
  const { fontWeight, fontStretch, fontItalicStyle } = parseFontStyle(style);
  if (fontWeight !== 'normal') {
    addStyle(styles, 'font-weight', fontWeight);
  }
  if (fontStretch !== 'normal') {
    addStyle(styles, 'font-stretch', fontStretch);
  }
  if (fontItalicStyle !== 'normal') {
    addStyle(styles, 'font-style', fontItalicStyle);
  }
  if (family !== 'Roboto') {
    addStyle(
      styles,
      'font-family',
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
    );
  }

  if (letterSpacing.value !== 0) {
    if (letterSpacing.unit === 'PERCENT') {
      warnNode(textSegment, 'Unsupported letter spacing using percent');
    } else {
      addStyle(styles, 'letter-spacing', [letterSpacing.value, 'px']);
    }
  }

  if (textCase !== 'ORIGINAL') {
    addStyle(
      styles,
      'text-transform',
      textCase === 'UPPER' ? 'uppercase' : textCase === 'LOWER' ? 'lowercase' : 'capitalize',
    );
  }

  if (textDecoration !== 'NONE') {
    addStyle(styles, 'text-decoration', textDecoration === 'STRIKETHROUGH' ? 'line-through' : 'underline');
  }
}
