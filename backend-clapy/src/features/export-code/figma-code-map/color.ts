import type { DeclarationPlain } from 'css-tree';

import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from '../code.model.js';
import type { TextNode2, TextSegment2 } from '../create-ts-compiler/canvas-utils.js';
import { addStyle } from '../css-gen/css-factories-high.js';
import { figmaColorToCssHex, warnNode } from '../gen-node-utils/utils-and-reset.js';

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
    if (fill.type === 'SOLID') {
      // fill.blendMode
      const { color, opacity } = fill;
      const hex = figmaColorToCssHex(color, opacity);
      addStyle(context, node, styles, 'color', hex);
    } else {
      warnNode(textSegment, 'Unsupported non solid text color (TODO)');
    }
  }

  // If no fill, any reset required? TBC
}
