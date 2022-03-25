import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { CodeContextWithBorders } from '../code.model';
import { FlexNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';
import { tagResets, warnNode } from './_utils-and-reset';

export function flexFigmaToCode(context: CodeContextWithBorders, node: FlexNode, styles: Dict<DeclarationPlain>) {
  if (node.layoutMode === 'NONE') {
    warnNode(node, 'Unsupported absolute positioning (TODO)');
    return;
  }
  addStyle(styles, 'display', 'flex');
  if (node.layoutMode === 'VERTICAL') {
    // row direction is the default. We can omit it.
    addStyle(styles, 'flex-direction', 'column');
  }

  // Padding is embedded here because, on Figma, it only applies to auto-layout elements.
  applyPadding(context, node, styles);

  // width, height
  // node.layoutGrow
  // node.layoutAlign
  // node.primaryAxisSizingMode
  // node.counterAxisSizingMode
  // node.primaryAxisAlignItems
  // node.counterAxisAlignItems
  // itemSpacing
}

// export function flexCodeToFigma() {
// }

function applyPadding(context: CodeContextWithBorders, node: FlexNode, styles: Dict<DeclarationPlain>) {
  let { paddingTop, paddingRight, paddingBottom, paddingLeft } = node;

  // Withdraw borders from padding because, on Figma, borders are on top of the padding (overlap).
  // But in CSS, borders are added to the padding (no overlap).
  const { borderTopWidth, borderRightWidth, borderBottomWidth, borderLeftWidth } = context.borderWidths;
  paddingTop -= borderTopWidth;
  if (paddingTop < 0) paddingTop = 0;
  paddingRight -= borderRightWidth;
  if (paddingRight < 0) paddingRight = 0;
  paddingBottom -= borderBottomWidth;
  if (paddingBottom < 0) paddingBottom = 0;
  paddingLeft -= borderLeftWidth;
  if (paddingLeft < 0) paddingLeft = 0;

  if (paddingTop || paddingRight || paddingBottom || paddingLeft) {
    if (paddingBottom === paddingLeft && paddingBottom === paddingTop && paddingBottom === paddingRight) {
      addStyle(styles, 'padding', [paddingTop, 'px']);
    } else if (paddingTop === paddingBottom && paddingLeft === paddingRight) {
      addStyle(styles, 'padding', [paddingTop, 'px'], [paddingRight, 'px']);
    } else if (paddingLeft === paddingRight) {
      addStyle(styles, 'padding', [paddingTop, 'px'], [paddingRight, 'px'], [paddingBottom, 'px']);
    } else {
      addStyle(styles, 'padding', [paddingTop, 'px'], [paddingRight, 'px'], [paddingBottom, 'px'], [paddingLeft, 'px']);
    }
  } else {
    // If no padding applied, check if a reset is required
    if (tagResets[context.tagName]?.padding) {
      addStyle(styles, 'padding', 0);
    }
  }
}
