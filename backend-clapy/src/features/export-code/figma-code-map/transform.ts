import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { isFlexNode, isGroup, isLine, ValidNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';
import { round } from './details/utils-and-reset';

export function transformFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  applyRotate(context, node, styles);
}

export function applyRotate(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  let rotation = node.rotation;
  if (!styles.transform && !!rotation) {
    rotation = round(rotation);
    addStyle(styles, 'transform', `rotate(${-rotation}deg)`);
    const { parentNode } = context;
    const parentIsAbsolute = isGroup(parentNode) || (isFlexNode(parentNode) && parentNode?.layoutMode === 'NONE');
    if (parentIsAbsolute) {
      const rotationOrigin = isLine(node) ? 'bottom left' : 'top left';
      addStyle(styles, 'transform-origin', rotationOrigin);
    }
  }
}
