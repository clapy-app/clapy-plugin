import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { isFlexNode, isGroup, isLine, isVector, ValidNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';
import { round } from './details/utils-and-reset';

export function transformFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  // The rotation is already included in the SVG itself when exporting from Figma
  if (isVector(node)) return;
  const [[a, c, tx0], [b, d, ty0]] = node.relativeTransform;
  const isIdentity = a === 1 && d === 1 && b === 0 && c === 0;
  if (!styles.transform && !isIdentity) {
    addTransform(context, `matrix(${round(a)}, ${round(b)}, ${round(c)}, ${round(d)}, 0, 0)`);

    const { parentNode } = context;
    const parentIsAbsolute = isGroup(parentNode) || (isFlexNode(parentNode) && parentNode?.layoutMode === 'NONE');
    if (parentIsAbsolute) {
      const rotationOrigin = isLine(node) ? 'bottom left' : 'top left';
      addStyle(context, node, styles, 'transform-origin', rotationOrigin);
    }
  }
}

function addTransform(context: NodeContext, transform: string) {
  if (!context.tranforms) {
    context.tranforms = [];
  }
  context.tranforms.push(transform);
}

export function postTransform(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  if (context.tranforms) {
    addStyle(context, node, styles, 'transform', context.tranforms.join(' '));
  }
}
