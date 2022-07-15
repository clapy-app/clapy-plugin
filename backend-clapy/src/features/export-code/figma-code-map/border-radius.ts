import type { DeclarationPlain } from 'css-tree';

import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from '../code.model.js';
import type { ValidNode } from '../create-ts-compiler/canvas-utils.js';
import { isGroup, isLine, isText, isVector } from '../create-ts-compiler/canvas-utils.js';
import { addStyle } from '../css-gen/css-factories-high.js';

export function borderRadiusFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  if (isText(node) || isVector(node) || isGroup(node) || isLine(node)) return;
  const { topLeftRadius, topRightRadius, bottomRightRadius, bottomLeftRadius } = node;
  if (topLeftRadius || topRightRadius || bottomRightRadius || bottomLeftRadius) {
    if (topLeftRadius === topRightRadius && topLeftRadius === bottomRightRadius && topLeftRadius === bottomLeftRadius) {
      addStyle(context, node, styles, 'border-radius', { borderRadiusTopLeft: [topLeftRadius, 'px'] });
    } else if (topLeftRadius === bottomRightRadius && topRightRadius === bottomLeftRadius) {
      addStyle(
        context,
        node,
        styles,
        'border-radius',
        { borderRadiusTopLeft: [topLeftRadius, 'px'] },
        { borderRadiusTopRight: [topRightRadius, 'px'] },
      );
    } else if (topRightRadius === bottomLeftRadius) {
      addStyle(
        context,
        node,
        styles,
        'border-radius',
        { borderRadiusTopLeft: [topLeftRadius, 'px'] },
        { borderRadiusTopRight: [topRightRadius, 'px'] },
        { borderRadiusBottomRight: [bottomRightRadius, 'px'] },
      );
    } else {
      addStyle(
        context,
        node,
        styles,
        'border-radius',
        { borderRadiusTopLeft: [topLeftRadius, 'px'] },
        { borderRadiusTopRight: [topRightRadius, 'px'] },
        { borderRadiusBottomRight: [bottomRightRadius, 'px'] },
        { borderRadiusBottomLeft: [bottomLeftRadius, 'px'] },
      );
    }
  }
}
