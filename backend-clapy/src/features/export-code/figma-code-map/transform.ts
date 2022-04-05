import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { isBaseFrameMixin, ValidNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';

export function transformFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  if (node.rotation) {
    addStyle(styles, 'transform', `rotate(${-node.rotation}deg)`);
    if (isBaseFrameMixin(node) && context.parentNode?.layoutMode === 'NONE') {
      addStyle(styles, 'transform-origin', `top left`);
    }
  }
}
