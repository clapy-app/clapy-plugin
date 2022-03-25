import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { CodeContext } from '../code.model';
import { addStyle } from '../css-gen/css-factories-high';
import { isMixed } from './_utils-and-reset';
import { parseFontStyle } from './details/fonts-utils';

export function fontFigmaToCode(context: CodeContext, node: TextNode, styles: Dict<DeclarationPlain>) {
  // TODO Should take font by fragment with different styles

  const { fontSize, fontName } = node;
  if (!isMixed(fontSize)) {
    addStyle(styles, 'font-size', [fontSize, 'px']);
  }
  if (!isMixed(fontName)) {
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
  }
}
