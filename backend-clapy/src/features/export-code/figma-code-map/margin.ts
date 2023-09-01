import type { Margins, NodeContext } from '../code.model.js';

import type { DeclarationPlain } from 'css-tree';

import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { ValidNode } from '../create-ts-compiler/canvas-utils.js';
import { addStyle, resetStyleIfOverriding } from '../css-gen/css-factories-high.js';

export function addMargin(context: NodeContext, margins: Margins) {
  if (!context.margins) {
    context.margins = {};
  }
  if (!context.margins.top) context.margins.top = 0;
  if (!context.margins.right) context.margins.right = 0;
  if (!context.margins.bottom) context.margins.bottom = 0;
  if (!context.margins.left) context.margins.left = 0;

  context.margins.top += margins.top || 0;
  context.margins.right += margins.right || 0;
  context.margins.bottom += margins.bottom || 0;
  context.margins.left += margins.left || 0;
}

export function marginFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  const margins = context.margins;
  if (margins?.top || margins?.right || margins?.bottom || margins?.left) {
    addStyle(
      context,
      node,
      styles,
      'margin',
      `${margins?.top || 0}px ${margins?.right || 0}px ${margins?.bottom || 0}px ${margins?.left || 0}px`,
    );
  } else {
    resetStyleIfOverriding(context, node, styles, 'margin');
  }
}
