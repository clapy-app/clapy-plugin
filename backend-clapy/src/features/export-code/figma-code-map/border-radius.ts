import { DeclarationPlain } from 'css-tree';
import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { isGroup, isLine, isText, isVector, ValidNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';

export function borderRadiusFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  if (isText(node) || isVector(node) || isGroup(node) || isLine(node)) return;
  const { topLeftRadius, topRightRadius, bottomRightRadius, bottomLeftRadius } = node;
  if (topLeftRadius || topRightRadius || bottomRightRadius || bottomLeftRadius) {
    if (topLeftRadius === topRightRadius && topLeftRadius === bottomRightRadius && topLeftRadius === bottomLeftRadius) {
      addStyle(styles, 'border-radius', [topLeftRadius, 'px']);
    } else if (topLeftRadius === bottomRightRadius && topRightRadius === bottomLeftRadius) {
      addStyle(styles, 'border-radius', [topLeftRadius, 'px'], [topRightRadius, 'px']);
    } else if (topRightRadius === bottomLeftRadius) {
      addStyle(styles, 'border-radius', [topLeftRadius, 'px'], [topRightRadius, 'px'], [bottomRightRadius, 'px']);
    } else {
      addStyle(
        styles,
        'border-radius',
        [topLeftRadius, 'px'],
        [topRightRadius, 'px'],
        [bottomRightRadius, 'px'],
        [bottomLeftRadius, 'px'],
      );
    }
  }
}
