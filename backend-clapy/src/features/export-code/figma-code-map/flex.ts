import { CssNodePlain, DeclarationPlain } from 'css-tree';
import { PropertiesHyphen } from 'csstype';

import { Nil } from '../../../common/general-utils';
import { flags } from '../../../env-and-config/app-config';
import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContextWithBorders } from '../code.model';
import {
  FlexNode,
  isFlexNode,
  isGroup,
  isLayout,
  isLine,
  isPage,
  isText,
  ValidNode,
} from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';
import { defaultNode } from './details/default-node';

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
type AlignItems = NonNullable<PropertiesHyphen['align-items']>;
const counterAlignToAlignItems: {
  [K in BaseFrameMixin['counterAxisAlignItems']]: AlignItems;
} = {
  MIN: 'flex-start', // stretch?
  CENTER: 'center',
  MAX: 'flex-end',
};
const textAlignHorizontalToCssTextAlign: {
  [K in Exclude<TextNode['textAlignHorizontal'], 'LEFT'>]: NonNullable<PropertiesHyphen['text-align']>;
} = {
  CENTER: 'center',
  RIGHT: 'end',
  JUSTIFIED: 'justify',
};
// const textAlignHorizontalToAlignItems: {
//   [K in Exclude<TextNode['textAlignHorizontal'], 'LEFT' | 'JUSTIFIED'>]: NonNullable<PropertiesHyphen['align-items']>;
// } = {
//   CENTER: 'center',
//   RIGHT: 'end',
// };
const textAlignVerticalToJustifyContent: {
  [K in Exclude<TextNode['textAlignVertical'], 'TOP'>]: NonNullable<PropertiesHyphen['justify-content']>;
} = {
  CENTER: 'center',
  BOTTOM: 'end',
};

export function flexFigmaToCode(context: NodeContextWithBorders, node: ValidNode, styles: Dict<DeclarationPlain>) {
  const isFlex = isFlexNode(node);

  const { parentStyles } = context;
  const {
    fixedWidth,
    widthFillContainer,
    fixedHeight,
    heightFillContainer,
    nodePrimaryAxisHugContents,
    nodeCounterAxisHugContents,
  } = applyWidth(context, node, styles);

  // Flex: 1 if it's a figma rule or it's a top-level component
  if (!isLine(node) && (node.layoutGrow === 1 || (context.isPageLevel && !nodePrimaryAxisHugContents))) {
    addStyle(styles, 'flex', 1);
  }

  // TODO add condition: parent must specify an align-items rule (left/center/right) and it's not stretch.
  // If no parent rule, it means it's already stretch (the default one).
  if (node.layoutAlign === 'STRETCH') {
    addStyle(styles, 'align-self', 'stretch');
    // Stretch is the default
  } else if (isFlex && nodeCounterAxisHugContents) {
    const parentAlignItems = readCssValueFromAst(parentStyles?.['align-items']) as AlignItems | null;
    if (parentStyles && (!parentAlignItems || parentAlignItems === 'stretch')) {
      addStyle(styles, 'align-self', 'flex-start');
    }
  }
  // nodePrimaryAxisHugContents is not checked because, in the primary axis, hug contents is the default behavior.

  if (isText(node)) {
    if (!nodeCounterAxisHugContents && node.textAlignHorizontal !== 'LEFT') {
      addStyle(styles, 'text-align', textAlignHorizontalToCssTextAlign[node.textAlignHorizontal]);
      // Seems useless? short (single line) and long (multi-line) texts should be tested.
      // if (node.textAlignHorizontal !== 'JUSTIFIED') {
      //   addStyle(styles, 'align-items', textAlignHorizontalToAlignItems[node.textAlignHorizontal]);
      // }
    }
    if (!nodePrimaryAxisHugContents && node.textAlignVertical !== 'TOP') {
      addStyle(styles, 'justify-content', textAlignVerticalToJustifyContent[node.textAlignVertical]);
    }
  }

  if (isFlex) {
    // display: flex is applied in mapCommonStyles

    if (node.layoutMode === (defaultNode.layoutMode === 'VERTICAL' ? 'HORIZONTAL' : 'VERTICAL')) {
      // column is used as default in index.css reset. We can omit it.
      addStyle(styles, 'flex-direction', defaultNode.layoutMode === 'VERTICAL' ? 'row' : 'column');
    }

    const [atLeastOneChildHasLayoutGrow1, atLeastOneChildHasLayoutAlignNotStretch] = checkChildrenLayout(node);

    if (
      (!nodePrimaryAxisHugContents || node.children.length > 1) &&
      node.primaryAxisAlignItems !== 'MIN' &&
      !atLeastOneChildHasLayoutGrow1
    ) {
      // use place-content instead of justify-content (+ align-content)
      addStyle(styles, 'place-content', primaryAlignToJustifyContent[node.primaryAxisAlignItems]);
    }

    if ((!nodeCounterAxisHugContents || node.children.length > 1) && atLeastOneChildHasLayoutAlignNotStretch) {
      addStyle(styles, 'align-items', counterAlignToAlignItems[node.counterAxisAlignItems]);
    }

    if (node.itemSpacing && node.children.length >= 2) {
      addStyle(styles, 'gap', [node.itemSpacing, 'px']);
    }

    // Padding is embedded here because, on Figma, it only applies to auto-layout elements.
    applyPadding(context, node, styles);
  }
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

function applyPadding(context: NodeContextWithBorders, node: FlexNode, styles: Dict<DeclarationPlain>) {
  let { paddingTop, paddingRight, paddingBottom, paddingLeft } = node;

  // Withdraw borders from padding because, on Figma, borders are on top of the padding (overlap).
  // But in CSS, borders are added to the padding (no overlap).
  const { borderTopWidth, borderRightWidth, borderBottomWidth, borderLeftWidth } = context.borderWidths;
  paddingTop = Math.max(paddingTop - borderTopWidth, 0);
  paddingRight = Math.max(paddingRight - borderRightWidth, 0);
  paddingBottom = Math.max(paddingBottom - borderBottomWidth, 0);
  paddingLeft = Math.max(paddingLeft - borderLeftWidth, 0);

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
    // if (tagResets[context.tagName]?.padding) {
    //   addStyle(styles, 'padding', 0);
    // }
  }
}

function applyWidth(context: NodeContextWithBorders, node: ValidNode, styles: Dict<DeclarationPlain>) {
  const isFlex = isFlexNode(node);
  const nodeIsText = isText(node);
  const nodeIsGroup = isGroup(node);

  const { borderTopWidth, borderRightWidth, borderBottomWidth, borderLeftWidth } = context.borderWidths;
  const parent = context.parentNode;
  const parentIsFlex = !parent || isFlexNode(parent);
  const parentIsAbsolute = isGroup(parent) || (isFlexNode(parent) && parent?.layoutMode === 'NONE');

  const isNodeAutoLayout = isFlex && node.layoutMode !== 'NONE';
  const isNodeVertical = isFlex && node.layoutMode === 'VERTICAL';
  const nodePrimaryAxisHugContents = isNodeAutoLayout && node.primaryAxisSizingMode === 'AUTO';
  const nodeCounterAxisHugContents = isNodeAutoLayout && node.counterAxisSizingMode === 'AUTO';
  const widthHugContents = isFlex
    ? isNodeVertical
      ? nodeCounterAxisHugContents
      : nodePrimaryAxisHugContents
    : nodeIsText
    ? node.textAutoResize === 'WIDTH_AND_HEIGHT'
    : false;
  const heightHugContents = isFlex
    ? isNodeVertical
      ? nodePrimaryAxisHugContents
      : nodeCounterAxisHugContents
    : nodeIsText
    ? node.textAutoResize === 'WIDTH_AND_HEIGHT' || node.textAutoResize === 'HEIGHT'
    : false;

  const isParentAutoLayout = !parent || (parentIsFlex && parent?.layoutMode !== 'NONE');
  const isParentVertical = isParentAutoLayout && parent?.layoutMode === 'VERTICAL';
  const parentPrimaryAxisFillContainer = isParentAutoLayout && node?.layoutGrow === 1;
  const parentCounterAxisFillContainer = isParentAutoLayout && node?.layoutAlign === 'STRETCH';
  const widthFillContainer =
    (isParentVertical ? parentCounterAxisFillContainer : parentPrimaryAxisFillContainer) ||
    (context.isPageLevel && !widthHugContents);
  const heightFillContainer =
    (isParentVertical ? parentPrimaryAxisFillContainer : parentCounterAxisFillContainer) ||
    (context.isPageLevel && !heightHugContents);

  const isWidthPositionAbsoluteAutoSize =
    !nodeIsGroup &&
    parentIsAbsolute &&
    (node.constraints.horizontal === 'STRETCH' || node.constraints.horizontal === 'SCALE');
  const isHeightPositionAbsoluteAutoSize =
    !nodeIsGroup &&
    parentIsAbsolute &&
    (node.constraints.vertical === 'STRETCH' || node.constraints.vertical === 'SCALE');

  const fixedWidth = !isWidthPositionAbsoluteAutoSize && !widthFillContainer && !widthHugContents;
  const fixedHeight = !isHeightPositionAbsoluteAutoSize && !heightFillContainer && !heightHugContents;

  const shiftTop = isFlex ? Math.max(node.paddingTop, borderTopWidth) : 0;
  const shiftRight = isFlex ? Math.max(node.paddingRight, borderRightWidth) : 0;
  const shiftBottom = isFlex ? Math.max(node.paddingBottom, borderBottomWidth) : 0;
  const shiftLeft = isFlex ? Math.max(node.paddingLeft, borderLeftWidth) : 0;

  const width = flags.useCssBoxSizingBorderBox ? node.width : node.width - shiftRight - shiftLeft;
  const height = flags.useCssBoxSizingBorderBox ? node.height : node.height - shiftTop - shiftBottom;

  const shouldApplyMaxSize = !parent || isPage(parent) || (parent.width >= node.width && parent.height >= node.height);
  if (fixedWidth) {
    addStyle(styles, 'width', [width, 'px']);
    if (shouldApplyMaxSize) {
      addStyle(styles, 'max-width', [100, '%']);
    }
  }
  if (fixedHeight) {
    addStyle(styles, 'height', [height, 'px']);
    if (shouldApplyMaxSize) {
      addStyle(styles, 'max-height', [100, '%']);
    }
  }
  return {
    fixedWidth,
    widthFillContainer,
    fixedHeight,
    heightFillContainer,
    nodePrimaryAxisHugContents,
    nodeCounterAxisHugContents,
  };
}

function readCssValueFromAst(node: CssNodePlain | Nil): string | null {
  if (!node) return null;
  switch (node.type) {
    case 'Raw':
      return node.value;
    case 'Value':
      return readCssValueFromAst(node.children[0]);
    case 'Identifier':
      return node.name;
    case 'Declaration':
      return readCssValueFromAst(node.value);
    default:
      throw new Error(`Reading css value from node unsupported: ${JSON.stringify(node)}`);
  }
}
