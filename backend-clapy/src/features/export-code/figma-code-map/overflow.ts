import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { isComponentSet, isRectangle, isText, isVector, ValidNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';
import { guessScroll } from '../smart-guesses/guessScroll';

export function overflowFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  if (isText(node) || isVector(node) || isRectangle(node) || isComponentSet(node)) return;
  const { x, y } = guessScroll(context, node, styles);
  if (node.overflowDirection === 'BOTH' || (x && y)) {
    addStyle(styles, 'overflow', 'auto');
  } else if (node.overflowDirection === 'VERTICAL' || y) {
    addStyle(styles, 'overflow-y', 'auto');
    if (node.clipsContent) {
      addStyle(styles, 'overflow-x', 'hidden');
    }
  } else if (node.overflowDirection === 'HORIZONTAL' || x) {
    addStyle(styles, 'overflow-x', 'auto');
    if (node.clipsContent) {
      addStyle(styles, 'overflow-y', 'hidden');
    }
  } else if (node.clipsContent) {
    addStyle(styles, 'overflow', 'hidden');
  }
}
