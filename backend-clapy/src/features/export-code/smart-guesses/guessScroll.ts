import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { isFlexNode, ValidNode } from '../create-ts-compiler/canvas-utils';

export function guessScroll(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  const name = context.nodeNameLower;
  const isFlex = isFlexNode(node);
  const isNodeAutoLayout = isFlex && node.layoutMode !== 'NONE';
  return name.includes('scroll') ? { x: true, y: true } : { x: false, y: context.isRootNode && isNodeAutoLayout };
}
