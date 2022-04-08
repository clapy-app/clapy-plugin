import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { isFlexNode, isGroup, ValidNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';

export function transformFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  applyRotate(context, node.rotation, styles);
}

export function applyRotate(context: NodeContext, rotation: number | undefined, styles: Dict<DeclarationPlain>) {
  if (!styles.transform && !!rotation) {
    addStyle(styles, 'transform', `rotate(${-rotation}deg)`);
    const { parentNode } = context;
    const parentIsAbsolute = isGroup(parentNode) || (isFlexNode(parentNode) && parentNode?.layoutMode === 'NONE');
    if (parentIsAbsolute) {
      addStyle(styles, 'transform-origin', `top left`);
    }
  }
}
