import type { DeclarationPlain, Raw, ValuePlain } from 'css-tree';

import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from '../code.model.js';
import type { ValidNode } from '../create-ts-compiler/canvas-utils.js';
import {
  isComponent,
  isConstraintMixin,
  isFlexNode,
  isGroup,
  isLine,
  isPage,
} from '../create-ts-compiler/canvas-utils.js';
import { addStyle, getInheritedNodeStyle, resetStyleIfOverriding } from '../css-gen/css-factories-high.js';
import { addTransformTranslateX, addTransformTranslateY } from './transform.js';

function applyPositionRelative(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  const inheritedStyle = getInheritedNodeStyle(context, 'position');
  if (!inheritedStyle || ((inheritedStyle.value as ValuePlain).children[0] as Raw).value === 'initial') {
    addStyle(context, node, styles, 'position', 'relative');
  }
}

export function positionAbsoluteFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  const isFlex = isFlexNode(node);
  const isGrp = isGroup(node);
  const nodeHasConstraints = isConstraintMixin(node);

  if (isFlex && node.layoutMode === 'NONE') {
    applyPositionRelative(context, node, styles);
  }

  // If we are here, the group was not skipped. It means the parent is a flex node (frame, instance...) with auto-layout. We must treat the group as a wrapper for position absolute, with scale mode.
  if (isGrp) {
    applyPositionRelative(context, node, styles);
    return;
  }

  const { parentNode, isRootNode, isRootInComponent } = context;
  const parentIsGroup = isGroup(parentNode);
  const parentIsAbsolute =
    !isRootNode &&
    !(isRootInComponent && isComponent(node) && isPage(node.parent)) &&
    (parentIsGroup || (isFlexNode(parentNode) && parentNode?.layoutMode === 'NONE'));
  if (parentIsAbsolute) {
    addStyle(context, node, styles, 'position', 'absolute');
    const { horizontal, vertical } =
      // The second part, !nodeHasConstraints, should be impossible, but let's add it for type checking and just in case.
      parentIsGroup || !nodeHasConstraints
        ? ({ horizontal: 'SCALE', vertical: 'SCALE' } as Constraints)
        : node.constraints;
    // STRETCH and SCALE are only applicable with fixed size (disabled on the UI with hug contents)

    // When an element is absolutely positioned in a group (itself within an autolayout frame), we apply the SCALE mode relative to the group. Since x/y are relative to the groupe parent, we adjust x/y to ensure the scale works well.
    const nodeX = parentIsGroup ? node.x - parentNode.x : node.x;
    const left = nodeX;
    // Don't subtract borderLeftWidth, it's already included in nodeX.
    const right = parentNode.width - nodeX - node.width;
    const parentWidth = parentNode.width;

    if (horizontal === 'MIN') {
      addStyle(context, node, styles, 'left', [left, 'px']);
      resetStyleIfOverriding(context, node, styles, 'right');
    } else if (horizontal === 'MAX') {
      addStyle(context, node, styles, 'right', [right, 'px']);
      resetStyleIfOverriding(context, node, styles, 'left');
    } else if (horizontal === 'CENTER') {
      // https://stackoverflow.com/a/25776315/4053349
      const toSubstractForLeftShift = parentNode.width / 2 - (left + node.width / 2);
      addStyle(
        context,
        node,
        styles,
        'left',
        toSubstractForLeftShift ? `calc(50% - ${toSubstractForLeftShift}px)` : '50%',
      );
      addTransformTranslateX(context, '-50%');
    } else if (horizontal === 'STRETCH') {
      addStyle(context, node, styles, 'left', [left, 'px']);
      addStyle(context, node, styles, 'right', [right, 'px']);
      node.autoWidth = true; // Auto-width
    } else if (horizontal === 'SCALE') {
      addStyle(context, node, styles, 'left', [(left / parentWidth) * 100, '%']);
      addStyle(context, node, styles, 'right', [(right / parentWidth) * 100, '%']);
      node.autoWidth = true; // Auto-width
    }

    const nodeY = parentIsGroup ? node.y - parentNode.y : node.y;
    let top = nodeY;
    // Don't subtract borderTopWidth, it's already included in nodeY.
    const bottom = parentNode.height - nodeY - node.height;
    const parentHeight = parentNode.height;

    if (isLine(node)) {
      top -= node.strokeWeight;
    }

    if (vertical === 'MIN') {
      addStyle(context, node, styles, 'top', [top, 'px']);
      resetStyleIfOverriding(context, node, styles, 'bottom');
    } else if (vertical === 'MAX') {
      addStyle(context, node, styles, 'bottom', [bottom, 'px']);
      resetStyleIfOverriding(context, node, styles, 'top');
    } else if (vertical === 'CENTER') {
      const toSubstractForTopShift = parentNode.height / 2 - (top + node.height / 2);
      addStyle(
        context,
        node,
        styles,
        'top',
        toSubstractForTopShift ? `calc(50% - ${toSubstractForTopShift}px)` : '50%',
      );
      addTransformTranslateY(context, '-50%');
    } else if (vertical === 'STRETCH') {
      addStyle(context, node, styles, 'top', [top, 'px']);
      addStyle(context, node, styles, 'bottom', [bottom, 'px']);
      node.autoHeight = true; // Auto-height
    } else if (vertical === 'SCALE') {
      addStyle(context, node, styles, 'top', [(top / parentHeight) * 100, '%']);
      addStyle(context, node, styles, 'bottom', [(bottom / parentHeight) * 100, '%']);
      node.autoHeight = true; // Auto-height
    }
  } else {
    resetStyleIfOverriding(context, node, styles, 'position', 'absolute');
    resetStyleIfOverriding(context, node, styles, 'top');
    resetStyleIfOverriding(context, node, styles, 'right');
    resetStyleIfOverriding(context, node, styles, 'bottom');
    resetStyleIfOverriding(context, node, styles, 'left');
    resetStyleIfOverriding(context, node, styles, 'margin', 'auto');
    resetStyleIfOverriding(context, node, styles, 'margin-top', 'auto');
    resetStyleIfOverriding(context, node, styles, 'margin-right', 'auto');
    resetStyleIfOverriding(context, node, styles, 'margin-bottom', 'auto');
    resetStyleIfOverriding(context, node, styles, 'margin-left', 'auto');
  }
}
