import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { TextNode2, TextSegment2 } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';
import { figmaColorToCssHex, warnNode } from './details/utils-and-reset';

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
