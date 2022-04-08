import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { ValidNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';

export function opacityFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  addOpacity(styles, node.opacity);
}

export function addOpacity(styles: Dict<DeclarationPlain>, opacity: number | undefined) {
  if (!styles.opacity && opacity != null && opacity !== 1) {
    addStyle(styles, 'opacity', opacity);
  }
}
