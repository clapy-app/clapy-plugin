import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { isGroup, isLine, isText, isVector, ValidNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';
import { figmaColorToCssHex, warnNode } from './details/utils-and-reset';

export function borderFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>): NodeContext {
  if (isVector(node) || isGroup(node)) {
    // Ignore borders for Vectors. They are already included in the SVG.
    return contextNoBorder(context);
  }

  const visibleStrokes = (node.strokes || []).filter(({ visible }) => visible);

  if (isText(node)) {
    // stroke has a different meaning on text. We will handle it later.
    if (visibleStrokes.length) {
      warnNode(node, 'TODO Unsupported stroke on text');
    }
    return contextNoBorder(context);
  }

  if (visibleStrokes.length) {
    if (visibleStrokes.length > 1) {
      warnNode(node, 'TODO Unsupported multiple borders, will only apply the first');
    }
    const stroke = visibleStrokes[0];
    if (stroke.type === 'SOLID') {
      // Examples of properties not supported yet:
      // stroke.blendMode
      // node.{strokeCap, strokeGeometry, strokeJoin, strokeMiterLimit}
      const { color, opacity } = stroke;
      const { strokeAlign, strokeWeight } = node;
      let borderWidth = strokeWeight;
      const hex = figmaColorToCssHex(color, opacity);
      if (isLine(node)) {
        if (borderWidth <= 1) {
          // Another way to do that for horizontal lines is box-shadow, but it doesn't work well with rotations and/or vertical lines.
          // box-shadow: 0 -1px 0 #000;
          addStyle(styles, 'border-bottom', 'solid', [borderWidth, 'px'], hex);
          addStyle(styles, 'margin-bottom', [-borderWidth, 'px']);
        } else {
          addStyle(styles, 'outline', 'solid', [borderWidth / 2, 'px'], hex);
        }
      } else if (node.width <= 1) {
        addStyle(styles, 'border-right', 'solid', [borderWidth, 'px'], hex);
        addStyle(styles, 'margin-right', [-borderWidth, 'px']);
      } else if (node.height <= 1) {
        addStyle(styles, 'border-bottom', 'solid', [borderWidth, 'px'], hex);
        addStyle(styles, 'margin-bottom', [-borderWidth, 'px']);
      } else {
        addStyle(styles, 'outline', 'solid', [borderWidth, 'px'], hex);
        if (strokeAlign === 'INSIDE') {
          addStyle(styles, 'outline-offset', [-borderWidth, 'px']);
        } else if (strokeAlign === 'CENTER') {
          addStyle(styles, 'outline-offset', [-borderWidth / 2, 'px']);
        }
      }
    } else {
      warnNode(node, 'TODO Unsupported non solid border');
    }
  }

  return contextNoBorder(context);
}

function contextNoBorder(context: NodeContext) {
  return {
    ...context,
    borderWidths: {
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
    },
  };
}
