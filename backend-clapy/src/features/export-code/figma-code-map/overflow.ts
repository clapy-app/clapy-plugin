import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { FlexNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';

export function overflowFigmaToCode(context: NodeContext, node: FlexNode, styles: Dict<DeclarationPlain>) {
  if (node.clipsContent) {
    addStyle(styles, 'overflow', 'hidden');
    // overflowDirection
  }
}
