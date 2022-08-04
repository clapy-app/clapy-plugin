import type { CssNodePlain, DeclarationPlain } from 'css-tree';
import type { PropertiesHyphen } from 'csstype';

import type { Nil } from '../../../common/general-utils.js';
import { flags } from '../../../env-and-config/app-config.js';
import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import { nodeDefaults } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from '../code.model.js';
import type { FlexNode, ValidNode } from '../create-ts-compiler/canvas-utils.js';
import {
  isConstraintMixin,
  isFlexNode,
  isGroup,
  isLayout,
  isLine,
  isPage,
  isText,
  isVector,
} from '../create-ts-compiler/canvas-utils.js';
import { addStyle, resetStyleIfOverriding } from '../css-gen/css-factories-high.js';

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
  [K in Exclude<BaseFrameMixin['primaryAxisAlignItems'] | 'SPACE_BETWEEN_SINGLE', 'MIN'>]: NonNullable<
    PropertiesHyphen['justify-content']
  >;
} = {
  // MIN: 'flex-start', // default
  MAX: 'flex-end',
  CENTER: 'center',
  SPACE_BETWEEN: 'space-between',
  SPACE_BETWEEN_SINGLE: 'space-around',
};
// counter axis
type AlignItems = NonNullable<PropertiesHyphen['align-items']>;
const counterAlignToAlignItems: {
  [K in BaseFrameMixin['counterAxisAlignItems']]: AlignItems;
} = {
  MIN: 'flex-start', // stretch?
  CENTER: 'center',
  MAX: 'flex-end',
  BASELINE: 'baseline',
};
const textAlignHorizontalToCssTextAlign: {
  [K in Exclude<TextNode['textAlignHorizontal'], 'LEFT'>]: NonNullable<PropertiesHyphen['text-align']>;
} = {
  CENTER: 'center',
  RIGHT: 'end',
  JUSTIFIED: 'justify',
};
const textAlignHorizontalToAlignItems: {
  [K in Exclude<TextNode['textAlignHorizontal'], 'LEFT' | 'JUSTIFIED'>]: NonNullable<PropertiesHyphen['align-items']>;
} = {
  CENTER: 'center',
  RIGHT: 'end',
};
const textAlignHorizontalToJustifyContent: {
  [K in Exclude<TextNode['textAlignHorizontal'], 'LEFT' | 'JUSTIFIED'>]: NonNullable<
    PropertiesHyphen['justify-content']
  >;
} = {
  CENTER: 'center',
  RIGHT: 'flex-end',
};
const textAlignVerticalToJustifyContent: {
  [K in Exclude<TextNode['textAlignVertical'], 'TOP'>]: NonNullable<PropertiesHyphen['justify-content']>;
} = {
  CENTER: 'center',
  BOTTOM: 'flex-end',
};

const textAlignVerticalToAlignItems: {
  [K in Exclude<TextNode['textAlignVertical'], 'TOP'>]: NonNullable<PropertiesHyphen['align-items']>;
} = {
  CENTER: 'center',
  BOTTOM: 'flex-end',
};

export function flexFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  const isFlex = isFlexNode(node);

  const { parentStyles, outerLayoutOnly } = context;
  const {
    isParentAutoLayout,
    isParentVertical,
    nodePrimaryAxisHugContents,
    nodeCounterAxisHugContents,
    parentAndNodeHaveSameDirection,
  } = applyWidth(context, node, styles);

  const defaultIsVertical = nodeDefaults.FRAME.layoutMode === 'VERTICAL';

  const parentPrimaryAxisHugContents = parentAndNodeHaveSameDirection
    ? nodePrimaryAxisHugContents
    : nodeCounterAxisHugContents;
  const applySettingFullWidthHeight = context.isRootNode && !!context.moduleContext.projectContext.extraConfig.page;
  const applySettingHugContents = context.isRootNode && !context.moduleContext.projectContext.extraConfig.page;

  // Flex: 1 if it's a figma rule or it's a top-level component
  if (!outerLayoutOnly && !isLine(node) && (node.layoutGrow === 1 || applySettingFullWidthHeight)) {
    addStyle(context, node, styles, 'flex', 1);
  } else {
    resetStyleIfOverriding(context, node, styles, 'flex');
  }

  const parentCounterAxisHugContents = parentAndNodeHaveSameDirection
    ? nodeCounterAxisHugContents
    : nodePrimaryAxisHugContents;

  // TODO add condition: parent must specify an align-items rule (left/center/right) and it's not stretch.
  // If no parent rule, it means it's already stretch (the default one).
  if ((isParentAutoLayout && node.layoutAlign === 'STRETCH') || applySettingFullWidthHeight) {
    addStyle(context, node, styles, 'align-self', 'stretch');
    resetStyleIfOverriding(context, node, styles, isParentVertical ? 'width' : 'height');
    // Stretch is the default
  } else if (isFlex && nodeCounterAxisHugContents) {
    const parentAlignItems = readCssValueFromAst(parentStyles?.['align-items']) as AlignItems | null;
    if ((parentStyles || applySettingHugContents) && (!parentAlignItems || parentAlignItems === 'stretch')) {
      addStyle(context, node, styles, 'align-self', 'flex-start');
    } else {
      resetStyleIfOverriding(context, node, styles, 'align-self');
    }
  } else {
    resetStyleIfOverriding(context, node, styles, 'align-self');
  }
  // nodePrimaryAxisHugContents is not checked because, in the primary axis, hug contents is the default behavior.

  if (!outerLayoutOnly && isText(node)) {
    if (!nodeCounterAxisHugContents && node.textAlignHorizontal !== 'LEFT') {
      addStyle(context, node, styles, 'text-align', textAlignHorizontalToCssTextAlign[node.textAlignHorizontal]);
      // Seems useless? short (single line) and long (multi-line) texts should be tested.
      if (node.textAlignHorizontal !== 'JUSTIFIED') {
        if (defaultIsVertical) {
          addStyle(context, node, styles, 'align-items', textAlignHorizontalToAlignItems[node.textAlignHorizontal]);
        } else {
          addStyle(
            context,
            node,
            styles,
            'justify-content',
            textAlignHorizontalToJustifyContent[node.textAlignHorizontal],
          );
        }
      }
    } else {
      resetStyleIfOverriding(context, node, styles, 'text-align');
      if (defaultIsVertical) {
        resetStyleIfOverriding(context, node, styles, 'align-items');
      } else {
        resetStyleIfOverriding(context, node, styles, 'justify-content');
      }
    }
    if (!nodePrimaryAxisHugContents && node.textAlignVertical !== 'TOP') {
      if (defaultIsVertical) {
        addStyle(context, node, styles, 'justify-content', textAlignVerticalToJustifyContent[node.textAlignVertical]);
      } else {
        addStyle(context, node, styles, 'align-items', textAlignVerticalToAlignItems[node.textAlignVertical]);
      }
    } else {
      if (defaultIsVertical) {
        resetStyleIfOverriding(context, node, styles, 'justify-content');
      } else {
        resetStyleIfOverriding(context, node, styles, 'align-items');
      }
    }
  }

  if (!outerLayoutOnly && isFlex) {
    // display: flex is applied in mapCommonStyles

    if (node.layoutMode === (defaultIsVertical ? 'HORIZONTAL' : 'VERTICAL')) {
      // row is used as default in index.css reset. We can omit it.
      addStyle(context, node, styles, 'flex-direction', defaultIsVertical ? 'row' : 'column');
    } else {
      resetStyleIfOverriding(context, node, styles, 'flex-direction');
    }

    const [atLeastOneChildHasLayoutGrow1, atLeastOneChildHasLayoutAlignNotStretch] = checkChildrenLayout(node);

    if (
      (!nodePrimaryAxisHugContents || node.children.length > 1) &&
      node.primaryAxisAlignItems !== 'MIN' &&
      !atLeastOneChildHasLayoutGrow1
    ) {
      // use place-content instead of justify-content (+ align-content)
      // If there is a single child, SPACE_BETWEEN centers children. Let's translate to space-around instead.
      const primaryAxisAlignItems = node.children?.length !== 1 ? node.primaryAxisAlignItems : 'SPACE_BETWEEN_SINGLE';
      addStyle(context, node, styles, 'place-content', primaryAlignToJustifyContent[primaryAxisAlignItems]);
    } else {
      resetStyleIfOverriding(context, node, styles, 'place-content');
    }

    if ((!nodeCounterAxisHugContents || node.children.length > 1) && atLeastOneChildHasLayoutAlignNotStretch) {
      addStyle(context, node, styles, 'align-items', counterAlignToAlignItems[node.counterAxisAlignItems]);
    } else {
      resetStyleIfOverriding(context, node, styles, 'align-items');
    }

    // May also cover paragraph-spacing, paragraphSpacing, paragraph spacing
    // (using multiple typo for future global text researches)
    if (node.itemSpacing && node.children.length >= 2 && node.primaryAxisAlignItems !== 'SPACE_BETWEEN') {
      addStyle(context, node, styles, 'gap', [node.itemSpacing, 'px']);
    } else {
      resetStyleIfOverriding(context, node, styles, 'gap');
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

function applyPadding(context: NodeContext, node: FlexNode, styles: Dict<DeclarationPlain>) {
  let { paddingTop, paddingRight, paddingBottom, paddingLeft } = node;

  // Withdraw borders from padding because, on Figma, borders are on top of the padding (overlap).
  // But in CSS, borders are added to the padding (no overlap).
  paddingTop = Math.max(paddingTop, 0);
  paddingRight = Math.max(paddingRight, 0);
  paddingBottom = Math.max(paddingBottom, 0);
  paddingLeft = Math.max(paddingLeft, 0);

  if (paddingTop || paddingRight || paddingBottom || paddingLeft) {
    if (paddingBottom === paddingLeft && paddingBottom === paddingTop && paddingBottom === paddingRight) {
      addStyle(context, node, styles, 'padding', { paddingTop: [paddingTop, 'px'] });
    } else if (paddingTop === paddingBottom && paddingLeft === paddingRight) {
      addStyle(
        context,
        node,
        styles,
        'padding',
        { paddingTop: [paddingTop, 'px'] },
        { paddingRight: [paddingRight, 'px'] },
      );
    } else if (paddingLeft === paddingRight) {
      addStyle(
        context,
        node,
        styles,
        'padding',
        { paddingTop: [paddingTop, 'px'] },
        { paddingRight: [paddingRight, 'px'] },
        { paddingBottom: [paddingBottom, 'px'] },
      );
    } else {
      addStyle(
        context,
        node,
        styles,
        'padding',
        { paddingTop: [paddingTop, 'px'] },
        { paddingRight: [paddingRight, 'px'] },
        { paddingBottom: [paddingBottom, 'px'] },
        { paddingLeft: [paddingLeft, 'px'] },
      );
    }
  } else {
    resetStyleIfOverriding(context, node, styles, 'padding');
  }
}

function applyWidth(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  const isFlex = isFlexNode(node);
  const nodeIsText = isText(node);
  const nodeIsGroup = isGroup(node);
  const nodeHasConstraints = isConstraintMixin(node);

  const parent = context.parentNode;
  const parentIsFlex = !parent || isFlexNode(parent);
  const parentIsAbsolute = isGroup(parent) || (isFlexNode(parent) && parent?.layoutMode === 'NONE');

  const isNodeAutoLayout = isFlex && node.layoutMode !== 'NONE';
  const isNodeVertical = isFlex && node.layoutMode === 'VERTICAL';
  const nodePrimaryAxisHugContents =
    isNodeAutoLayout && node.primaryAxisSizingMode === 'AUTO' && !!node.children.length;
  const nodeCounterAxisHugContents =
    isNodeAutoLayout && node.counterAxisSizingMode === 'AUTO' && !!node.children.length;
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
  const fullWidthHeightFromSetting = context.isRootNode && !!context.moduleContext.projectContext.extraConfig.page;
  // For root absolute container, fill width to try responsiveness,
  // but respect the wireframe height.
  const widthFillContainer =
    (isParentVertical ? parentCounterAxisFillContainer : parentPrimaryAxisFillContainer) || fullWidthHeightFromSetting;
  const heightFillContainer =
    (isParentVertical ? parentPrimaryAxisFillContainer : parentCounterAxisFillContainer) || fullWidthHeightFromSetting;

  const isWidthPositionAbsoluteAutoSize =
    !nodeIsGroup &&
    parentIsAbsolute &&
    nodeHasConstraints &&
    (node.constraints.horizontal === 'STRETCH' || node.constraints.horizontal === 'SCALE');
  const isHeightPositionAbsoluteAutoSize =
    !nodeIsGroup &&
    parentIsAbsolute &&
    nodeHasConstraints &&
    (node.constraints.vertical === 'STRETCH' || node.constraints.vertical === 'SCALE');

  const fixedWidth = !isWidthPositionAbsoluteAutoSize && !widthFillContainer && !widthHugContents;
  const fixedHeight = !isHeightPositionAbsoluteAutoSize && !heightFillContainer && !heightHugContents;

  const shiftTop = isFlex ? node.paddingTop : 0;
  const shiftRight = isFlex ? node.paddingRight : 0;
  const shiftBottom = isFlex ? node.paddingBottom : 0;
  const shiftLeft = isFlex ? node.paddingLeft : 0;

  let width = flags.useCssBoxSizingBorderBox ? node.width : node.width - shiftRight - shiftLeft;
  let height = flags.useCssBoxSizingBorderBox ? node.height : node.height - shiftTop - shiftBottom;

  const isSeparatorOrWorkaround = width <= 1 || height <= 1;

  const parentHasHorizontalScroll =
    parent && parentIsFlex && (parent.overflowDirection === 'HORIZONTAL' || parent.overflowDirection === 'BOTH');
  const parentHasVerticalScroll =
    parent && parentIsFlex && (parent.overflowDirection === 'VERTICAL' || parent.overflowDirection === 'BOTH');
  const parentIsPage = isPage(parent);
  const parentRequireMaxSize = !parent || parentIsPage;
  const parentIsBiggerThanNode = parent && !parentIsPage && parent.width >= node.width && parent.height >= node.height;

  // Let's try fewer cases with max width/height and see how it goes.
  // To adapt with more use cases identified.

  // const shouldApplyMaxWidth = parentRequireMaxSize || (parentIsBiggerThanNode && !parentHasHorizontalScroll);
  const shouldApplyMaxWidth = isSeparatorOrWorkaround;
  const shouldApplyMaxHeight =
    (fixedHeight && parentRequireMaxSize && isNodeAutoLayout) ||
    isSeparatorOrWorkaround; /* || (parentIsBiggerThanNode && !parentHasVerticalScroll) */

  if (fixedWidth) {
    // Patch for svg 0 width with stroke to match Figma behavior
    // The other part of the patch is in readSvg (process-nodes-utils.ts).
    if (isVector(node) && node.strokeWeight > width) {
      width = node.strokeWeight;
    }
    addStyle(context, node, styles, 'width', [width, 'px']);
  } /* if (node.autoWidth) */ else {
    // I'm not sure which one has highest priority between fixedWidth and node.autoWidth. To review with a test case.
    resetStyleIfOverriding(context, node, styles, 'width');
  }

  if (shouldApplyMaxWidth) {
    addStyle(context, node, styles, 'max-width', [100, '%']);
  }
  if (fixedHeight) {
    // Patch for svg 0 height with stroke to match Figma behavior
    if (isVector(node) && node.strokeWeight > height) {
      height = node.strokeWeight;
    }
    addStyle(context, node, styles, 'height', [height, 'px']);
  } /* if (node.autoHeight) */ else {
    // I'm not sure which one has highest priority between fixedHeight and node.autoHeight. To review with a test case.
    resetStyleIfOverriding(context, node, styles, 'height');
  }
  if (shouldApplyMaxHeight) {
    addStyle(context, node, styles, 'max-height', [100, '%']);
  }
  const parentAndNodeHaveSameDirection = isParentVertical === isNodeVertical;
  return {
    isParentAutoLayout,
    isParentVertical,
    isNodeVertical,
    fixedWidth,
    widthFillContainer,
    fixedHeight,
    heightFillContainer,
    nodePrimaryAxisHugContents,
    nodeCounterAxisHugContents,
    parentAndNodeHaveSameDirection,
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
