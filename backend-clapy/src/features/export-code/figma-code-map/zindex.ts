import type { DeclarationPlain } from 'css-tree';

import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from '../code.model.js';
import type { ValidNode } from '../create-ts-compiler/canvas-utils.js';
import { isFlexNode } from '../create-ts-compiler/canvas-utils.js';
import { addStyle } from '../css-gen/css-factories-high.js';

export function zindexFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  const { parentStyles, parentNode } = context;
  if (
    parentStyles &&
    parentStyles['outline'] &&
    parentStyles['outline-offset'] &&
    isFlexNode(parentNode) &&
    !parentNode.clipsContent
  ) {
    addStyle(context, node, styles, 'z-index', 0);
  }
}
