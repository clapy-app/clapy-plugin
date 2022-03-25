import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { CodeContext } from '../code.model';
import { addStyle } from '../css-gen/css-factories-high';
import { figmaColorToCssRGBA, warnNode } from './_utils-and-reset';

export function colorFigmaToCode(context: CodeContext, node: TextNode, styles: Dict<DeclarationPlain>) {
  const visibleFills = (Array.isArray(node.fills) ? (node.fills as Paint[]) : []).filter(({ visible }) => visible);
  if (visibleFills.length) {
    if (visibleFills.length > 1) {
      warnNode(node, 'Unsupported multiple text colors, will only apply the first (TODO)');
    }
    const fill = visibleFills[0];
    if (fill.type === 'SOLID') {
      // fill.blendMode
      const { color, opacity } = fill;
      const hex = figmaColorToCssRGBA(color, opacity);
      addStyle(styles, 'color', hex);
    } else {
      warnNode(node, 'Unsupported non solid text color (TODO)');
    }
  }

  // If no fill, any reset required? TBC
}
