import type { DeclarationPlain } from 'css-tree';

import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from '../code.model.js';
import type { ValidNode } from '../create-ts-compiler/canvas-utils.js';
import { isVector } from '../create-ts-compiler/canvas-utils.js';
import { addStyle } from '../css-gen/css-factories-high.js';

export function opacityFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  // The opacity is already included in the SVG itself when exporting from Figma
  if (isVector(node)) return;
  addOpacity(context, node, styles, node.opacity);
}

export function addOpacity(
  context: NodeContext,
  node: ValidNode,
  styles: Dict<DeclarationPlain>,
  opacity: number | undefined,
) {
  if (!styles.opacity && opacity != null && opacity !== 1) {
    addStyle(context, node, styles, 'opacity', opacity);
  }
}
