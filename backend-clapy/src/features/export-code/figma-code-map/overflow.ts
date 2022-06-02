import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import {
  isComponentSet,
  isGroup,
  isLine,
  isRectangle,
  isText,
  isVector,
  ValidNode,
} from '../create-ts-compiler/canvas-utils';
import { addStyle, resetStyleIfOverriding } from '../css-gen/css-factories-high';
import { guessScroll } from '../smart-guesses/guessScroll';

export function overflowFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  if (isVector(node)) {
    if (!(node as any).clipsContent) {
      // SVG might paint some content outside their viewbox (supported on Figma). If clipsContent is disabled, the overflow is visible.
      addStyle(context, node, styles, 'overflow', 'visible');
      resetStyleIfOverriding(context, node, styles, 'overflow-x');
      resetStyleIfOverriding(context, node, styles, 'overflow-y');
    }
  }
  if (isText(node) || isVector(node) || isRectangle(node) || isComponentSet(node) || isGroup(node) || isLine(node))
    return;
  const { x, y } = guessScroll(context, node, styles);
  if (node.overflowDirection === 'BOTH' || (x && y)) {
    addStyle(context, node, styles, 'overflow', 'auto');
    resetStyleIfOverriding(context, node, styles, 'overflow-x');
    resetStyleIfOverriding(context, node, styles, 'overflow-y');
  } else if (node.overflowDirection === 'VERTICAL' || y) {
    addStyle(context, node, styles, 'overflow-y', 'auto');
    if (node.clipsContent) {
      addStyle(context, node, styles, 'overflow-x', 'hidden');
    } else {
      resetStyleIfOverriding(context, node, styles, 'overflow-x');
    }
    resetStyleIfOverriding(context, node, styles, 'overflow');
  } else if (node.overflowDirection === 'HORIZONTAL' || x) {
    addStyle(context, node, styles, 'overflow-x', 'auto');
    if (node.clipsContent) {
      addStyle(context, node, styles, 'overflow-y', 'hidden');
    } else {
      resetStyleIfOverriding(context, node, styles, 'overflow-y');
    }
    resetStyleIfOverriding(context, node, styles, 'overflow');
  } else if (node.clipsContent) {
    addStyle(context, node, styles, 'overflow', 'hidden');
    resetStyleIfOverriding(context, node, styles, 'overflow-x');
    resetStyleIfOverriding(context, node, styles, 'overflow-y');
  }
}
