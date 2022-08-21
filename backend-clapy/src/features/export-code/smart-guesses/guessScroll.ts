import type { DeclarationPlain } from 'css-tree';

import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from '../code.model.js';
import type { ValidNode } from '../create-ts-compiler/canvas-utils.js';
import { isFlexNode } from '../create-ts-compiler/canvas-utils.js';

export function guessScroll(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  const name = context.nodeNameLower;
  const isFlex = isFlexNode(node);
  // const isNodeAutoLayout = isFlex && node.layoutMode !== 'NONE';
  return name.includes('scroll')
    ? { x: true, y: true }
    : // scroll guessing is disabled for now. We rely on the explicit "Full width/height" config to set the scroll.
      { x: false, y: false /* context.isRootNode && isNodeAutoLayout */ };
}
