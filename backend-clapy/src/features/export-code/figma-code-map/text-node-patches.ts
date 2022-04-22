import { DeclarationPlain } from 'css-tree';
import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { isText, ValidNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';

export function textNodePatchesFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  if (isText(node) && node.textAutoResize === 'WIDTH_AND_HEIGHT') {
    addStyle(styles, 'white-space', 'nowrap');
  }
}
