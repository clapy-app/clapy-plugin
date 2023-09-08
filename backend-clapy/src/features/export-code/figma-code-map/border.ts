import type { DeclarationPlain } from 'css-tree';

import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from '../code.model.js';
import type {
  BooleanOperationNode2,
  GroupNode2,
  ValidNode,
  VectorNodeDerived,
} from '../create-ts-compiler/canvas-utils.js';
import { isBaseFrameMixin, isGroup, isLine, isText, isVector } from '../create-ts-compiler/canvas-utils.js';
import { addStyle, resetStyleIfOverriding } from '../css-gen/css-factories-high.js';
import { strokeWeightX, strokeWeightY } from '../gen-node-utils/mixed-props-utils.js';
import { figmaColorToCssHex, isMixed, warnNode } from '../gen-node-utils/utils-and-reset.js';
import { addBoxShadow } from './effects.js';
import { addMargin } from './margin.js';

export function prepareBorders(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>): void {
  if (doesNotHaveBorders(node)) {
    // Ignore borders for Vectors. They are already included in the SVG.
    return;
  }
  node.visibleStrokes = (node.strokes || []).filter(({ visible }) => visible);
  alterPaddingMargin(context, node, styles);
}

function alterPaddingMargin(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  if (doesNotHaveBorders(node)) {
    return;
  }
  if (isText(node)) {
    return;
  }
  const visibleStrokes = node.visibleStrokes;
  if (!visibleStrokes?.length) {
    return;
  }
  const stroke = visibleStrokes[0];
  if (stroke.type !== 'SOLID') {
    return;
  }
  if (isLine(node)) {
    return;
  }
  // To use after the figma typings lib is updated instead of checking Rectangle.
  // if (!isAutoLayoutMixin(node)) {
  //   return;
  // }
  if (!isBaseFrameMixin(node)) {
    return;
  }
  let { strokeAlign, strokeWeight } = node;
  if (typeof strokeWeight !== 'number') strokeWeight = 0;
  if (strokeAlign === 'INSIDE' && node.strokesIncludedInLayout) {
    node.paddingTop += node.strokeTopWeight || strokeWeight;
    node.paddingRight += node.strokeRightWeight || strokeWeight;
    node.paddingBottom += node.strokeBottomWeight || strokeWeight;
    node.paddingLeft += node.strokeLeftWeight || strokeWeight;
  }
  if (strokeAlign === 'CENTER' && node.strokesIncludedInLayout) {
    node.paddingTop += (node.strokeTopWeight || strokeWeight) / 2;
    node.paddingRight += (node.strokeRightWeight || strokeWeight) / 2;
    node.paddingBottom += (node.strokeBottomWeight || strokeWeight) / 2;
    node.paddingLeft += (node.strokeLeftWeight || strokeWeight) / 2;
  }
  if (outsideBorderInLayout(context, node)) {
    addMargin(context, {
      top: node.strokeTopWeight || strokeWeight,
      right: node.strokeRightWeight || strokeWeight,
      bottom: node.strokeBottomWeight || strokeWeight,
      left: node.strokeLeftWeight || strokeWeight,
    });
  }
  if (centerBorderInLayout(context, node)) {
    addMargin(context, {
      top: (node.strokeTopWeight || strokeWeight) / 2,
      right: (node.strokeRightWeight || strokeWeight) / 2,
      bottom: (node.strokeBottomWeight || strokeWeight) / 2,
      left: (node.strokeLeftWeight || strokeWeight) / 2,
    });
  }
}

function outsideBorderInLayout(context: NodeContext, node: BaseFrameMixin) {
  return !!(
    node.strokes?.length &&
    node.strokeAlign === 'OUTSIDE' &&
    isBaseFrameMixin(context.parentNode) &&
    context.parentNode?.strokesIncludedInLayout
  );
}

function centerBorderInLayout(context: NodeContext, node: BaseFrameMixin) {
  return !!(
    node.strokes?.length &&
    node.strokeAlign === 'CENTER' &&
    isBaseFrameMixin(context.parentNode) &&
    context.parentNode?.strokesIncludedInLayout
  );
}

export function hasBorderThatRequireMargin(context: NodeContext, node: BaseFrameMixin) {
  return outsideBorderInLayout(context, node) || centerBorderInLayout(context, node);
}

function doesNotHaveBorders(node: ValidNode): node is VectorNodeDerived | GroupNode2 | BooleanOperationNode2 {
  return isVector(node) || isGroup(node);
}

export function borderFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>): void {
  if (doesNotHaveBorders(node)) {
    // Ignore borders for Vectors. They are already included in the SVG.
    return;
  }

  const visibleStrokes = node.visibleStrokes;

  if (isText(node)) {
    // stroke has a different meaning on text. We will handle it later.
    if (visibleStrokes?.length) {
      warnNode(node, 'TODO Unsupported stroke on text');
    }
    return;
  }

  if (visibleStrokes?.length) {
    if (visibleStrokes.length > 1) {
      warnNode(node, 'TODO Unsupported multiple borders, will only apply the first');
      // If implementing it, also check alterPadding above.
    }
    const stroke = visibleStrokes[0];
    if (stroke.type === 'SOLID') {
      // Examples of properties not supported yet:
      // stroke.blendMode
      // node.{strokeCap, strokeGeometry, strokeJoin, strokeMiterLimit}
      const { color, opacity } = stroke;
      const { strokeAlign } = node;
      const hex = figmaColorToCssHex(color, opacity);
      if (isLine(node)) {
        const borderHeight = strokeWeightY(node);
        if (borderHeight <= 1) {
          // Another way to do that for horizontal lines is box-shadow, but it doesn't work well with rotations and/or vertical lines.
          // box-shadow: 0 -1px 0 #000;
          addStyle(
            context,
            node,
            styles,
            'border-bottom',
            'solid',
            { borderWidth: [borderHeight, 'px'] },
            { border: hex },
          );
          addMargin(context, { bottom: -1 });
          if (node.dashPattern?.length === 2) {
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
        } else {
          addStyle(
            context,
            node,
            styles,
            'outline',
            'solid',
            { borderWidth: [borderHeight, 'px', 0.5] },
            { border: hex },
          );
          if (node.dashPattern?.length === 2) {
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
        }
      } else if (node.width <= 1) {
        let borderWidth = strokeWeightX(node);
        addStyle(context, node, styles, 'border-right', 'solid', { borderWidth: [borderWidth, 'px'] }, { border: hex });
        addMargin(context, { right: -1 });
        if (node.dashPattern?.length === 2) {
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
      } else if (node.height <= 1) {
        const borderHeight = strokeWeightY(node);
        addStyle(
          context,
          node,
          styles,
          'border-bottom',
          'solid',
          { borderWidth: [borderHeight, 'px'] },
          { border: hex },
        );
        addMargin(context, { bottom: -1 });
        if (node.dashPattern?.length === 2) {
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
      } else {
        // If strokes are included in the layout (recent Figma property), we could use CSS normal borders instead of outline/shadow.

        const strokeWeight = node.strokeWeight;
        const { strokeTopWeight, strokeRightWeight, strokeBottomWeight, strokeLeftWeight } = node;
        if (!isMixed(strokeWeight)) {
          addStyle(context, node, styles, 'outline', 'solid', { borderWidth: [strokeWeight, 'px'] }, { border: hex });
          if (strokeAlign === 'INSIDE') {
            addStyle(context, node, styles, 'outline-offset', { borderWidth: [strokeWeight, 'px', -1] });
          } else if (strokeAlign === 'CENTER') {
            addStyle(context, node, styles, 'outline-offset', { borderWidth: [strokeWeight, 'px', -0.5] });
          } else {
            resetStyleIfOverriding(context, node, styles, 'outline-offset');
          }
          if (node.dashPattern?.length === 2) {
            addStyle(context, node, styles, 'outline-style', 'dashed');
          } else {
            resetStyleIfOverriding(context, node, styles, 'outline-style');
          }
        } else {
          // Individual strokes. Outline doesn't work, so we use shadows instead.
          if (strokeAlign !== 'CENTER') {
            const isInside = strokeAlign === 'INSIDE';
            const multiplier = isInside ? -1 : 1;
            const insetPrefix = isInside ? 'inset ' : '';
            if (strokeTopWeight) {
              addBoxShadow(context, isInside, 0, -multiplier * strokeTopWeight, 0, undefined, hex);
            }
            if (strokeRightWeight) {
              addBoxShadow(context, isInside, multiplier * strokeRightWeight, 0, 0, undefined, hex);
            }
            if (strokeBottomWeight) {
              addBoxShadow(context, isInside, 0, multiplier * strokeBottomWeight, 0, undefined, hex);
            }
            if (strokeLeftWeight) {
              addBoxShadow(context, isInside, multiplier * strokeLeftWeight, 0, 0, undefined, hex);
            }
          } else {
            if (strokeTopWeight) {
              addBoxShadow(context, undefined, 0, -strokeTopWeight, 0, undefined, hex);
              addBoxShadow(context, true, 0, strokeTopWeight, 0, undefined, hex);
            }
            if (strokeRightWeight) {
              addBoxShadow(context, undefined, strokeRightWeight, 0, 0, undefined, hex);
              addBoxShadow(context, true, -strokeRightWeight, 0, 0, undefined, hex);
            }
            if (strokeBottomWeight) {
              addBoxShadow(context, undefined, 0, strokeBottomWeight, 0, undefined, hex);
              addBoxShadow(context, true, 0, -strokeBottomWeight, 0, undefined, hex);
            }
            if (strokeLeftWeight) {
              addBoxShadow(context, undefined, -strokeLeftWeight, 0, 0, undefined, hex);
              addBoxShadow(context, true, strokeLeftWeight, 0, 0, undefined, hex);
            }
          }
        }
        resetStyleIfOverriding(context, node, styles, 'border');
        resetStyleIfOverriding(context, node, styles, 'border-top');
        resetStyleIfOverriding(context, node, styles, 'border-right');
        resetStyleIfOverriding(context, node, styles, 'border-bottom');
        resetStyleIfOverriding(context, node, styles, 'border-left');
      }
    } else {
      warnNode(node, 'TODO Unsupported non solid border');
      // If implementing it, also check alterPadding above.
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
  }

  return;
}
