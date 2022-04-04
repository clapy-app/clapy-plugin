import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { FlexTextVectorNode } from '../create-ts-compiler/canvas-utils';

export function guessScroll(context: NodeContext, node: FlexTextVectorNode, styles: Dict<DeclarationPlain>) {
  const name = context.nodeNameLower;
  return name.includes('scroll') ? { x: true, y: true } : { x: false, y: false };
}
