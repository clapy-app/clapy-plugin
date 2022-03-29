import { DeclarationPlain } from 'css-tree';
import { PropertiesHyphen } from 'csstype';

import { flags } from '../../../env-and-config/app-config';
import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { CodeContextWithBorders } from '../code.model';
import { FlexNode, isLayout } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';
import { tagResets, warnNode } from './details/utils-and-reset';

// type LayoutAlignMap = {
//   [key in LayoutMixin['layoutAlign']]: string;
// };

// const layoutAlignMap: {
//   [key in Exclude<LayoutMixin['layoutAlign'], 'STRETCH' | 'INHERIT'>]: NonNullable<PropertiesHyphen['align-self']>;
// } = {
//   CENTER: 'center',
//   MIN: 'flex-start',
//   MAX: 'flex-end',
//   // INHERIT: 'inherit',
// };

// primary axis
const primaryAlignToJustifyContent: {
  [K in Exclude<BaseFrameMixin['primaryAxisAlignItems'], 'MIN'>]: NonNullable<PropertiesHyphen['justify-content']>;
} = {
  // MIN: 'flex-start', // default
  MAX: 'flex-end',
  CENTER: 'center',
  SPACE_BETWEEN: 'space-between',
};
// counter axis
const alignItemsToCounterAlign: {
  [K in BaseFrameMixin['counterAxisAlignItems']]: NonNullable<PropertiesHyphen['align-items']>;
} = {
  MIN: 'flex-start', // stretch?
  CENTER: 'center',
  MAX: 'flex-end',
};

export function flexFigmaToCode(context: CodeContextWithBorders, node: FlexNode, styles: Dict<DeclarationPlain>) {
  if (node.layoutMode === 'NONE') {
    warnNode(node, 'TODO Unsupported absolute positioning');
    return;
  }
  addStyle(styles, 'display', 'flex');
  if (node.layoutMode === 'VERTICAL') {
    // row direction is the default. We can omit it.
    addStyle(styles, 'flex-direction', 'column');
  }

  if (node.layoutGrow === 1) {
    addStyle(styles, 'flex', 1);
  }

  // TODO add condition: parent must specify an align-items rule (left/center/right) and it's not stretch.
  // If no parent rule, it means it's already stretch (the default one).
  if (node.layoutAlign === 'STRETCH') {
    addStyle(styles, 'align-self', 'stretch');
    // Stretch is the default
  }

  const [atLeastOneChildHasLayoutGrow1, atLeastOneChildHasLayoutAlignNotStretch] = checkChildrenLayout(node);

  if (node.primaryAxisAlignItems !== 'MIN' && !atLeastOneChildHasLayoutGrow1) {
    // use place-content instead of justify-content (+ align-content)
    // TODO fails to skip on Button
    addStyle(styles, 'place-content', primaryAlignToJustifyContent[node.primaryAxisAlignItems]);
  }

  if (atLeastOneChildHasLayoutAlignNotStretch) {
    // TODO fails twice to skip when should be skipped: with child text, on badge group, badge and Button
    addStyle(styles, 'align-items', alignItemsToCounterAlign[node.counterAxisAlignItems]);
  }

  if (node.itemSpacing && node.children.length >= 2) {
    addStyle(styles, 'gap', [node.itemSpacing, 'px']);
  }

  // Padding is embedded here because, on Figma, it only applies to auto-layout elements.
  applyPadding(context, node, styles);

  applyWidth(context, node, styles);
}

function checkChildrenLayout(node: FlexNode) {
  let atLeastOneChildHasLayoutGrow1 = false;
  let atLeastOneChildHasLayoutAlignNotStretch = false;
  for (const child of node.children) {
    if (isLayout(child)) {
      if (child.layoutGrow === 1) {
        atLeastOneChildHasLayoutGrow1 = true;
      }
      if (child.layoutAlign !== 'STRETCH') {
        // TODO a child text node, full-width by default, should be treated as stretch
        atLeastOneChildHasLayoutAlignNotStretch = true;
      }
      if (atLeastOneChildHasLayoutGrow1 && atLeastOneChildHasLayoutAlignNotStretch) {
        break;
      }
    }
  }
  return [atLeastOneChildHasLayoutGrow1, atLeastOneChildHasLayoutAlignNotStretch];
}

// export function flexCodeToFigma() {
// }

function applyPadding(context: CodeContextWithBorders, node: FlexNode, styles: Dict<DeclarationPlain>) {
  let { paddingTop, paddingRight, paddingBottom, paddingLeft } = node;

  // Withdraw borders from padding because, on Figma, borders are on top of the padding (overlap).
  // But in CSS, borders are added to the padding (no overlap).
  const { borderTopWidth, borderRightWidth, borderBottomWidth, borderLeftWidth } = context.borderWidths;
  paddingTop -= borderTopWidth;
  if (paddingTop < 0) paddingTop = 0;
  paddingRight -= borderRightWidth;
  if (paddingRight < 0) paddingRight = 0;
  paddingBottom -= borderBottomWidth;
  if (paddingBottom < 0) paddingBottom = 0;
  paddingLeft -= borderLeftWidth;
  if (paddingLeft < 0) paddingLeft = 0;

  if (paddingTop || paddingRight || paddingBottom || paddingLeft) {
    if (paddingBottom === paddingLeft && paddingBottom === paddingTop && paddingBottom === paddingRight) {
      addStyle(styles, 'padding', [paddingTop, 'px']);
    } else if (paddingTop === paddingBottom && paddingLeft === paddingRight) {
      addStyle(styles, 'padding', [paddingTop, 'px'], [paddingRight, 'px']);
    } else if (paddingLeft === paddingRight) {
      addStyle(styles, 'padding', [paddingTop, 'px'], [paddingRight, 'px'], [paddingBottom, 'px']);
    } else {
      addStyle(styles, 'padding', [paddingTop, 'px'], [paddingRight, 'px'], [paddingBottom, 'px'], [paddingLeft, 'px']);
    }
  } else {
    // If no padding applied, check if a reset is required
    if (tagResets[context.tagName]?.padding) {
      addStyle(styles, 'padding', 0);
    }
  }
}

function applyWidth(context: CodeContextWithBorders, node: FlexNode, styles: Dict<DeclarationPlain>) {
  // const parentHorizontal = figmaParentNode.layoutMode === 'HORIZONTAL';
  // const parentAndNodeHaveSameDirection = parentHorizontal === nodeHorizontal;

  const parent = context.parentNode;

  const isParentVertical = parent?.layoutMode === 'VERTICAL';
  const parentPrimaryAxisFillContainer = node?.layoutGrow === 1;
  const parentCounterAxisFillContainer = node?.layoutAlign === 'STRETCH';
  const parentWidthFillContainer = isParentVertical ? parentCounterAxisFillContainer : parentPrimaryAxisFillContainer;
  const parentHeightFillContainer = isParentVertical ? parentPrimaryAxisFillContainer : parentCounterAxisFillContainer;

  const isNodeVertical = node.layoutMode === 'VERTICAL';
  const nodePrimaryAxisHugContents = node.primaryAxisSizingMode === 'AUTO';
  const nodeCounterAxisHugContents = node.counterAxisSizingMode === 'AUTO';
  const nodeWidthHugContents = isNodeVertical ? nodeCounterAxisHugContents : nodePrimaryAxisHugContents;
  const nodeHeightHugContents = isNodeVertical ? nodePrimaryAxisHugContents : nodeCounterAxisHugContents;

  const fixedWidth = !parentWidthFillContainer && !nodeWidthHugContents;
  const fixedHeight = !parentHeightFillContainer && !nodeHeightHugContents;
  const width = flags.useCssBorderBox ? node.width : node.width - node.paddingRight - node.paddingLeft;
  const height = flags.useCssBorderBox ? node.height : node.height - node.paddingTop - node.paddingBottom;

  if (fixedWidth) {
    addStyle(styles, 'width', [width, 'px']);
    addStyle(styles, 'max-width', [100, '%']);
  }
  if (fixedHeight) {
    addStyle(styles, 'height', [height, 'px']);
    addStyle(styles, 'max-height', [100, '%']);
  }
}
