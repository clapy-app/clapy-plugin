import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { CodeContext } from '../code.model';
import { FlexNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';

export function borderRadiusFigmaToCode(context: CodeContext, node: FlexNode, styles: Dict<DeclarationPlain>) {
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