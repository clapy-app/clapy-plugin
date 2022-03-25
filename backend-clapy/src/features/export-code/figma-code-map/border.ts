import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { CodeContext, CodeContextWithBorders } from '../code.model';
import { FlexNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';
import { figmaColorToCssRGBA, tagResets, warnNode } from './details/utils-and-reset';

export function borderFigmaToCode(
  context: CodeContext,
  node: FlexNode,
  styles: Dict<DeclarationPlain>,
): CodeContextWithBorders {
  const visibleStrokes = (node.strokes || []).filter(({ visible }) => visible);
  if (visibleStrokes.length) {
    if (visibleStrokes.length > 1) {
      warnNode(node, 'Unsupported multiple borders, will only apply the first (TODO)');
    }
    const stroke = visibleStrokes[0];
    if (stroke.type === 'SOLID') {
      // stroke.blendMode
      // node.{strokeCap, strokeGeometry, strokeJoin, strokeMiterLimit}
      const { color, opacity } = stroke;
      const { strokeAlign, strokeWeight } = node;
      const borderWidth = strokeWeight;
      const hex = figmaColorToCssRGBA(color, opacity);
      addStyle(styles, 'border', 'solid', [borderWidth, 'px'], hex);
      return {
        ...context,
        borderWidths: {
          borderTopWidth: borderWidth,
          borderRightWidth: borderWidth,
          borderBottomWidth: borderWidth,
          borderLeftWidth: borderWidth,
        },
      };
    } else {
      warnNode(node, 'Unsupported non solid border (TODO)');
    }
  }

  // If no border applied, check if a reset is required
  if (tagResets[context.tagName]?.border) {
    addStyle(styles, 'border', 'none');
  }
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
