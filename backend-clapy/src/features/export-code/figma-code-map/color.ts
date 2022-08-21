import type { DeclarationPlain } from 'css-tree';
import type { PropertiesHyphen } from 'csstype';

import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from '../code.model.js';
import type { TextNode2, TextSegment2 } from '../create-ts-compiler/canvas-utils.js';
import { addStyle, resetStyleIfOverriding } from '../css-gen/css-factories-high.js';
import { warnNode } from '../gen-node-utils/utils-and-reset.js';
import { applyNonSolidBackgrounds, fillToCssBackground } from './background.js';

export function colorFigmaToCode(
  context: NodeContext,
  textSegment: TextSegment2,
  styles: Dict<DeclarationPlain>,
  node: TextNode2,
) {
  const visibleFills = (Array.isArray(textSegment.fills) ? (textSegment.fills as Paint[]) : []).filter(
    ({ visible }) => visible,
  );
  if (visibleFills.length) {
    if (visibleFills.length > 1) {
      warnNode(textSegment, 'Unsupported multiple text colors, will only apply the first (TODO)');
    }
    const fill = visibleFills[0];

    const bgColors: string[] = [];
    const bgImages: string[] = [];
    const bgSizes: PropertiesHyphen['background-size'][] = [];
    fillToCssBackground(context, node, fill, bgColors, bgImages, bgSizes);

    if (bgColors.length) {
      addStyle(context, node, styles, 'color', bgColors[0]);
    } else {
      resetStyleIfOverriding(context, node, styles, 'color');
    }

    applyNonSolidBackgrounds(context, node, styles, bgImages, bgSizes);

    if (bgImages.length) {
      addStyle(context, node, styles, '-webkit-background-clip', `text`);
      addStyle(context, node, styles, 'background-clip', `text`);
      addStyle(context, node, styles, '-webkit-text-fill-color', `transparent`);
    } else {
      resetStyleIfOverriding(context, node, styles, '-webkit-background-clip');
      resetStyleIfOverriding(context, node, styles, 'background-clip');
      resetStyleIfOverriding(context, node, styles, '-webkit-text-fill-color');
    }
  } else {
    resetStyleIfOverriding(context, node, styles, 'color');
    resetStyleIfOverriding(context, node, styles, 'background-image');
    resetStyleIfOverriding(context, node, styles, '-webkit-background-clip');
    resetStyleIfOverriding(context, node, styles, 'background-clip');
    resetStyleIfOverriding(context, node, styles, '-webkit-text-fill-color');
  }

  // If no fill, any reset required? TBC
}
