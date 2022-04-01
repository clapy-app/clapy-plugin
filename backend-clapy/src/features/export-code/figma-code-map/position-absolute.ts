import { DeclarationPlain } from 'css-tree';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContextWithBorders } from '../code.model';
import { FlexOrTextNode, isFlexNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';

export function positionAbsoluteFigmaToCode(
  context: NodeContextWithBorders,
  node: FlexOrTextNode,
  styles: Dict<DeclarationPlain>,
) {
  const isFlex = isFlexNode(node);

  if (isFlex && node.layoutMode === 'NONE') {
    addStyle(styles, 'position', 'relative');
  }

  const { parentNode, parentContext } = context;
  const { borderTopWidth, borderRightWidth, borderBottomWidth, borderLeftWidth } = parentContext?.borderWidths || {
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  };
  if (parentNode?.layoutMode === 'NONE') {
    addStyle(styles, 'position', 'absolute');
    const { horizontal, vertical } = node.constraints;
    // STRETCH and SCALE are only applicable with fixed size (disabled on the UI with hug contents)

    const left = node.x - borderLeftWidth;
    // Don't subtract borderLeftWidth, it's already included in node.x.
    const right = parentNode.width - node.x - node.width - borderRightWidth;
    const parentWidth = parentNode.width - borderLeftWidth - borderRightWidth;

    let translateX = false;
    if (horizontal === 'MIN') {
      addStyle(styles, 'left', [left, 'px']);
    } else if (horizontal === 'MAX') {
      addStyle(styles, 'right', [right, 'px']);
    } else if (horizontal === 'CENTER') {
      addStyle(styles, 'left', [((left + node.width / 2) / parentWidth) * 100, '%']);
      translateX = true;
    } else if (horizontal === 'STRETCH') {
      addStyle(styles, 'left', [left, 'px']);
      addStyle(styles, 'right', [right, 'px']);
    } else if (horizontal === 'SCALE') {
      addStyle(styles, 'left', [(left / parentWidth) * 100, '%']);
      addStyle(styles, 'right', [(right / parentWidth) * 100, '%']);
    }

    const top = node.y - borderTopWidth;
    // Don't subtract borderTopWidth, it's already included in node.y.
    const bottom = parentNode.height - node.y - node.height - borderBottomWidth;
    const parentHeight = parentNode.height - borderTopWidth - borderBottomWidth;
    let translateY = false;

    if (vertical === 'MIN') {
      addStyle(styles, 'top', [top, 'px']);
    } else if (vertical === 'MAX') {
      addStyle(styles, 'bottom', [bottom, 'px']);
    } else if (vertical === 'STRETCH') {
      addStyle(styles, 'top', [top, 'px']);
      addStyle(styles, 'bottom', [bottom, 'px']);
    } else if (vertical === 'CENTER') {
      addStyle(styles, 'top', [((top + node.height / 2) / parentHeight) * 100, '%']);
      translateY = true;
    } else if (vertical === 'SCALE') {
      addStyle(styles, 'top', [(top / parentHeight) * 100, '%']);
      addStyle(styles, 'bottom', [(bottom / parentHeight) * 100, '%']);
    }

    if (translateX && translateY) {
      addStyle(styles, 'transform', 'translate(-50%, -50%)');
    } else if (translateX) {
      addStyle(styles, 'transform', 'translateX(-50%)');
    } else if (translateY) {
      addStyle(styles, 'transform', 'translateY(-50%)');
    }
  }
}
