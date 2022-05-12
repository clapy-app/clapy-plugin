import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { isVector, ValidNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';

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
