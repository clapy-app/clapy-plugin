import type { DeclarationPlain } from 'css-tree';

import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from '../code.model.js';
import type { ValidNode } from '../create-ts-compiler/canvas-utils.js';
import { isFlexNode } from '../create-ts-compiler/canvas-utils.js';

export function guessScroll(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  const name = context.nodeNameLower;
  const isFlex = isFlexNode(node);
  const isNodeAutoLayout = isFlex && node.layoutMode !== 'NONE';
  return name.includes('scroll') ? { x: true, y: true } : { x: false, y: context.isRootNode && isNodeAutoLayout };
}
