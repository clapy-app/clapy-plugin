import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { isFlexNode, ValidNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';

export function zindexFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  const { parentStyles, parentNode } = context;
  if (
    parentStyles &&
    parentStyles['outline'] &&
    parentStyles['outline-offset'] &&
    isFlexNode(parentNode) &&
    !parentNode.clipsContent
  ) {
    addStyle(styles, 'z-index', 0);
  }
}
