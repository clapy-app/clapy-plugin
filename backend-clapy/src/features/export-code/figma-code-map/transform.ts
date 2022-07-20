import type { DeclarationPlain } from 'css-tree';

import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from '../code.model.js';
import type { ValidNode } from '../create-ts-compiler/canvas-utils.js';
import { isFlexNode, isGroup, isLine, isVector } from '../create-ts-compiler/canvas-utils.js';
import { addStyle, resetStyleIfOverriding } from '../css-gen/css-factories-high.js';
import { round } from '../gen-node-utils/utils-and-reset.js';

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

export function addTransform(context: NodeContext, transform: string) {
  if (!context.tranforms) {
    context.tranforms = [];
  }
  context.tranforms.push(transform);
}

export function addTransformTranslateX(context: NodeContext, value: string) {
  context.transformTranslateX = value;
}

export function addTransformTranslateY(context: NodeContext, value: string) {
  context.transformTranslateY = value;
}

export function postTransform(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  if (context.transformTranslateX && context.transformTranslateY) {
    addTransform(context, `translate(${context.transformTranslateX}, ${context.transformTranslateY})`);
  } else if (context.transformTranslateX) {
    addTransform(context, `translateX(${context.transformTranslateX})`);
  } else if (context.transformTranslateY) {
    addTransform(context, `translateY(${context.transformTranslateY})`);
  }
  if (context.tranforms) {
    addStyle(context, node, styles, 'transform', context.tranforms.join(' '));
  } else {
    resetStyleIfOverriding(context, node, styles, 'transform');
  }
}
