import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { FlexOrTextNode, isText } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';

export function overflowFigmaToCode(context: NodeContext, node: FlexOrTextNode, styles: Dict<DeclarationPlain>) {
  if (isText(node)) return;
  if (node.clipsContent) {
    addStyle(styles, 'overflow', 'hidden');
    // overflowDirection
  }
}
