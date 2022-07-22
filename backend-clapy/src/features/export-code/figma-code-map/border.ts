import type { DeclarationPlain } from 'css-tree';

import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from '../code.model.js';
import type {
  BooleanOperationNode2,
  GroupNode2,
  ValidNode,
  VectorNodeDerived,
} from '../create-ts-compiler/canvas-utils.js';
import { isGroup, isLine, isText, isVector } from '../create-ts-compiler/canvas-utils.js';
import { addStyle, resetStyleIfOverriding } from '../css-gen/css-factories-high.js';
import { figmaColorToCssHex, warnNode } from '../gen-node-utils/utils-and-reset.js';

export function prepareBorders(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>): void {
  if (doesNotHaveBorders(node)) {
    // Ignore borders for Vectors. They are already included in the SVG.
    return;
  }
  node.visibleStrokes = (node.strokes || []).filter(({ visible }) => visible);
}

function doesNotHaveBorders(node: ValidNode): node is VectorNodeDerived | GroupNode2 | BooleanOperationNode2 {
  return isVector(node) || isGroup(node);
}

export function borderFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>): void {
  if (doesNotHaveBorders(node)) {
    // Ignore borders for Vectors. They are already included in the SVG.
    return;
  }

  const visibleStrokes = node.visibleStrokes!;

  if (isText(node)) {
    // stroke has a different meaning on text. We will handle it later.
    if (visibleStrokes.length) {
      warnNode(node, 'TODO Unsupported stroke on text');
    }
    return;
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
          addStyle(
            context,
            node,
            styles,
            'border-bottom',
            'solid',
            { borderWidth: [borderWidth, 'px'] },
            { border: hex },
          );
          addStyle(context, node, styles, 'margin-bottom', { borderWidth: [borderWidth, 'px', -1] });
          if (node.dashPattern.length === 2) {
            addStyle(context, node, styles, 'border-style', 'dashed');
          } else {
            resetStyleIfOverriding(context, node, styles, 'border-style');
          }
          resetStyleIfOverriding(context, node, styles, 'outline');
          resetStyleIfOverriding(context, node, styles, 'outline-offset');
          resetStyleIfOverriding(context, node, styles, 'border');
          resetStyleIfOverriding(context, node, styles, 'border-top');
          resetStyleIfOverriding(context, node, styles, 'border-right');
          resetStyleIfOverriding(context, node, styles, 'border-left');
          resetStyleIfOverriding(context, node, styles, 'margin');
          resetStyleIfOverriding(context, node, styles, 'margin-top');
          resetStyleIfOverriding(context, node, styles, 'margin-right');
          resetStyleIfOverriding(context, node, styles, 'margin-left');
        } else {
          addStyle(
            context,
            node,
            styles,
            'outline',
            'solid',
            { borderWidth: [borderWidth, 'px', 0.5] },
            { border: hex },
          );
          if (node.dashPattern.length === 2) {
            addStyle(context, node, styles, 'outline-style', 'dashed');
          } else {
            resetStyleIfOverriding(context, node, styles, 'outline-style');
          }
          resetStyleIfOverriding(context, node, styles, 'outline-offset');
          resetStyleIfOverriding(context, node, styles, 'border');
          resetStyleIfOverriding(context, node, styles, 'border-top');
          resetStyleIfOverriding(context, node, styles, 'border-right');
          resetStyleIfOverriding(context, node, styles, 'border-bottom');
          resetStyleIfOverriding(context, node, styles, 'border-left');
          resetStyleIfOverriding(context, node, styles, 'margin');
          resetStyleIfOverriding(context, node, styles, 'margin-top');
          resetStyleIfOverriding(context, node, styles, 'margin-right');
          resetStyleIfOverriding(context, node, styles, 'margin-bottom');
          resetStyleIfOverriding(context, node, styles, 'margin-left');
        }
      } else if (node.width <= 1) {
        addStyle(context, node, styles, 'border-right', 'solid', { borderWidth: [borderWidth, 'px'] }, { border: hex });
        addStyle(context, node, styles, 'margin-right', { borderWidth: [borderWidth, 'px', -1] });
        if (node.dashPattern.length === 2) {
          addStyle(context, node, styles, 'border-style', 'dashed');
        } else {
          resetStyleIfOverriding(context, node, styles, 'border-style');
        }
        resetStyleIfOverriding(context, node, styles, 'outline');
        resetStyleIfOverriding(context, node, styles, 'outline-offset');
        resetStyleIfOverriding(context, node, styles, 'border');
        resetStyleIfOverriding(context, node, styles, 'border-top');
        resetStyleIfOverriding(context, node, styles, 'border-bottom');
        resetStyleIfOverriding(context, node, styles, 'border-left');
        resetStyleIfOverriding(context, node, styles, 'margin');
        resetStyleIfOverriding(context, node, styles, 'margin-top');
        resetStyleIfOverriding(context, node, styles, 'margin-bottom');
        resetStyleIfOverriding(context, node, styles, 'margin-left');
      } else if (node.height <= 1) {
        addStyle(
          context,
          node,
          styles,
          'border-bottom',
          'solid',
          { borderWidth: [borderWidth, 'px'] },
          { border: hex },
        );
        addStyle(context, node, styles, 'margin-bottom', { borderWidth: [borderWidth, 'px', -1] });
        if (node.dashPattern.length === 2) {
          addStyle(context, node, styles, 'border-style', 'dashed');
        } else {
          resetStyleIfOverriding(context, node, styles, 'border-style');
        }
        resetStyleIfOverriding(context, node, styles, 'outline');
        resetStyleIfOverriding(context, node, styles, 'outline-offset');
        resetStyleIfOverriding(context, node, styles, 'border');
        resetStyleIfOverriding(context, node, styles, 'border-top');
        resetStyleIfOverriding(context, node, styles, 'border-right');
        resetStyleIfOverriding(context, node, styles, 'border-left');
        resetStyleIfOverriding(context, node, styles, 'margin');
        resetStyleIfOverriding(context, node, styles, 'margin-top');
        resetStyleIfOverriding(context, node, styles, 'margin-right');
        resetStyleIfOverriding(context, node, styles, 'margin-left');
      } else {
        addStyle(context, node, styles, 'outline', 'solid', { borderWidth: [borderWidth, 'px'] }, { border: hex });
        if (strokeAlign === 'INSIDE') {
          addStyle(context, node, styles, 'outline-offset', { borderWidth: [borderWidth, 'px', -1] });
        } else if (strokeAlign === 'CENTER') {
          addStyle(context, node, styles, 'outline-offset', { borderWidth: [borderWidth, 'px', -0.5] });
        } else {
          resetStyleIfOverriding(context, node, styles, 'outline-offset');
        }
        if (node.dashPattern.length === 2) {
          addStyle(context, node, styles, 'outline-style', 'dashed');
        } else {
          resetStyleIfOverriding(context, node, styles, 'outline-style');
        }
        resetStyleIfOverriding(context, node, styles, 'border');
        resetStyleIfOverriding(context, node, styles, 'border-top');
        resetStyleIfOverriding(context, node, styles, 'border-right');
        resetStyleIfOverriding(context, node, styles, 'border-bottom');
        resetStyleIfOverriding(context, node, styles, 'border-left');
        resetStyleIfOverriding(context, node, styles, 'margin');
        resetStyleIfOverriding(context, node, styles, 'margin-top');
        resetStyleIfOverriding(context, node, styles, 'margin-right');
        resetStyleIfOverriding(context, node, styles, 'margin-bottom');
        resetStyleIfOverriding(context, node, styles, 'margin-left');
      }
    } else {
      warnNode(node, 'TODO Unsupported non solid border');
    }
  } else {
    resetStyleIfOverriding(context, node, styles, 'outline');
    resetStyleIfOverriding(context, node, styles, 'outline-offset');
    resetStyleIfOverriding(context, node, styles, 'outline-style');
    resetStyleIfOverriding(context, node, styles, 'border');
    resetStyleIfOverriding(context, node, styles, 'border-top');
    resetStyleIfOverriding(context, node, styles, 'border-right');
    resetStyleIfOverriding(context, node, styles, 'border-bottom');
    resetStyleIfOverriding(context, node, styles, 'border-left');
    resetStyleIfOverriding(context, node, styles, 'margin');
    resetStyleIfOverriding(context, node, styles, 'margin-top');
    resetStyleIfOverriding(context, node, styles, 'margin-right');
    resetStyleIfOverriding(context, node, styles, 'margin-bottom');
    resetStyleIfOverriding(context, node, styles, 'margin-left');
  }

  return;
}
