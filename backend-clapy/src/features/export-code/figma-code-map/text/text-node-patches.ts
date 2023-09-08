import type { DeclarationPlain } from 'css-tree';

import type { Dict } from '../../../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from '../../code.model.js';
import type { ValidNode } from '../../create-ts-compiler/canvas-utils.js';
import { isText } from '../../create-ts-compiler/canvas-utils.js';
import { addStyle } from '../../css-gen/css-factories-high.js';

export function textNodePatchesFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  if (isText(node) && node.textAutoResize === 'WIDTH_AND_HEIGHT') {
    addStyle(context, node, styles, 'white-space', 'nowrap');
  }
}
