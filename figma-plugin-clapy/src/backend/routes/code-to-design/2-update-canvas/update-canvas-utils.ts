import type { AbsoluteElementToAdd, BorderWidths, RenderContext } from '../1-import-stories/import-model';
import type { Nil } from '../../../../common/app-models';
import type {
  CElementNode,
  CNode,
  CPseudoElementNode,
  CTextNode,
  MyStyles,
  MyStylesPE,
  Properties,
  Property,
} from '../../../../common/sb-serialize.model';
import { cssDefaults, isCElementNode, isCTextNode } from '../../../../common/sb-serialize.model';
import type { LayoutNode } from '../../../common/node-type-utils';
import { isFrame, isGroup, isLayout, isText } from '../../../common/node-type-utils';

const loadedFonts = new Map<string, Promise<void>>();

export async function ensureFontIsLoaded(font: FontName) {
  const fontCacheKey = `${font.family}_${font.style}`;
  if (!loadedFonts.has(fontCacheKey)) {
    const p = figma.loadFontAsync(font);
    loadedFonts.set(fontCacheKey, p);
    // Loading fonts takes time. We are in a loop and we don't want other loop runs to also load the font. So the cache returns the promise of the font we are already loading, so that everybody awaits a shared font loading.
    await p;
  } else {
    await loadedFonts.get(fontCacheKey);
  }
}

export function cssFontWeightToFigmaValue(fontWeight: string) {
  if (!isNumeric(fontWeight)) {
    throw new Error(`Unsupported textual font weight from CSS for now. To implement: ${fontWeight}`);
  }
  const weight = roundHundred(sizeWithUnitToPx(fontWeight));
  if (weight < 100) return 'Thin';
  if (weight > 900) return 'Black';
  switch (weight) {
    case 100:
      return 'Thin';
    case 200:
      return 'ExtraLight';
    case 300:
      return 'Light';
    case 400:
      return 'Regular';
    case 500:
      return 'Medium';
    case 600:
      return 'SemiBold';
    case 700:
      return 'Bold';
    case 800:
      return 'ExtraBold';
    case 900:
      return 'Black';
    default:
      return 'Regular';
  }
}

type TextAlignHorizontal = TextNode['textAlignHorizontal'];
type TextAlignVertical = TextNode['textAlignVertical'];

export function calcTextAlignVertical(
  node: TextNode,
  context: RenderContext,
  sbNode: CTextNode,
): [TextAlignHorizontal, TextAlignVertical] {
  const { figmaParentNode, sbParentNode } = context;
  if (!sbParentNode) {
    return ['LEFT', 'TOP'];
  }
  const { textAlign, alignItems, justifyContent } = sbParentNode.styles;
  const ta: Property.TextAlign = textAlign;
  const ai: Property.AlignItems = alignItems;
  const jc: Property.AlignItems = justifyContent;
  const parentHorizontal = figmaParentNode.layoutMode === 'HORIZONTAL';
  // If parent layout is horizontal:
  //   text horizontal alignment:
  //     With multi line: only text-align applies
  //     With single line: Only justify content affects it (text-align has no effect).
  //   text vertical alignment: only align items affects it.
  // If parent layout is vertical:
  //   text horizontal alignment:
  //     With multi line: only text-align applies (align items has no effect)
  //     With single line: align items has the priority, if not defined (or default) text-align applies.
  //   text vertical alignment: only justify content affects it.
  // We can't handle the single/multi-line subtleties, so let's give priority to text-align in all cases.
  if (parentHorizontal) {
    return [
      textAlignToTextHorizontal[ta] || justifyContentToTextHorizontal[jc] || 'LEFT',
      alignItemsToTextVertical[ai] || 'TOP',
    ];
  } else {
    return [
      textAlignToTextHorizontal[ta] || alignItemsToTextHorizontal[ai] || 'LEFT',
      justifyContentToTextVertical[jc] || 'TOP',
    ];
  }
}

const textAlignToTextHorizontal: Partial<{
  [K in Property.TextAlign]: TextAlignHorizontal;
}> = {
  center: 'CENTER',
  right: 'RIGHT',
  end: 'RIGHT',
  justify: 'JUSTIFIED',
  left: 'LEFT',
  start: 'LEFT',
};

const justifyContentToTextHorizontal: Partial<{
  [K in Property.JustifyContent]: TextAlignHorizontal;
}> = {
  center: 'CENTER',
  'space-around': 'CENTER',
  'space-evenly': 'CENTER',
  'flex-end': 'RIGHT',
  end: 'RIGHT',
  right: 'RIGHT',
  left: 'LEFT',
  start: 'LEFT',
  'flex-start': 'LEFT',
  'space-between': 'LEFT',
};

const alignItemsToTextVertical: Partial<{
  [K in Property.AlignItems]: TextAlignVertical;
}> = {
  center: 'CENTER',
  end: 'BOTTOM',
  'flex-end': 'BOTTOM',
  'self-end': 'BOTTOM',
  baseline: 'TOP',
  start: 'TOP',
  'flex-start': 'TOP',
  'self-start': 'TOP',
};

const alignItemsToTextHorizontal: Partial<{
  [K in Property.AlignItems]: TextAlignHorizontal;
}> = {
  center: 'CENTER',
  end: 'RIGHT',
  'flex-end': 'RIGHT',
  'self-end': 'RIGHT',
  baseline: 'LEFT',
  start: 'LEFT',
  'flex-start': 'LEFT',
  'self-start': 'LEFT',
};

const justifyContentToTextVertical: Partial<{
  [K in Property.JustifyContent]: TextAlignVertical;
}> = {
  center: 'CENTER',
  'space-around': 'CENTER',
  'space-evenly': 'CENTER',
  'flex-end': 'BOTTOM',
  end: 'BOTTOM',
  right: 'BOTTOM',
  left: 'TOP',
  start: 'TOP',
  'flex-start': 'TOP',
  'space-between': 'TOP',
};

const rgbaRegex = 'rgba?\\((\\d{1,3}),\\s*(\\d{1,3}),\\s*(\\d{1,3})(,\\s*(\\d*\\.?\\d+))?\\)';
const sizeRegex = '(-?\\d*\\.?\\d+)(px)';

export function cssRGBAToFigmaValue(rgb: string): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
  const matchRGB = new RegExp(rgbaRegex);
  const match = matchRGB.exec(rgb);
  if (match == null) {
    console.warn('Incorrect RGB value from CSS:', rgb);
    return { r: 1, g: 1, b: 1, a: 1 };
  }
  return rgbaRawMatchToFigma(match[1], match[2], match[3], match[5]);
}

export interface BorderMapping {
  color: Properties['borderColor'];
  style: Properties['borderStyle'];
  width: number;
  x: 1 | 0 | -1;
  y: 1 | 0 | -1;
}

function areBordersTheSame(borderMapping: BorderMapping[]) {
  let latestColor: Properties['borderColor'];
  let latestStyle: Properties['borderStyle'];
  let latestWidth: number | undefined;
  let first = true;
  for (const { color, style, width } of borderMapping) {
    if (!first) {
      if (color !== latestColor || style !== latestStyle || width !== latestWidth) return false;
    } else {
      first = false;
    }
    latestColor = color;
    latestStyle = style;
    latestWidth = width;
  }
  return true;
}

export function appendBackgroundColor(backgroundColor: Properties['backgroundColor'], fills: Paint[]) {
  const { r, g, b, a } = cssRGBAToFigmaValue(backgroundColor as string);
  if (a > 0) {
    fills.push({
      type: 'SOLID',
      color: { r, g, b },
      opacity: a ?? 1,
    });
  }
  return fills;
}

export function appendBackgroundImage(sbNode: CElementNode | CPseudoElementNode, fills: Paint[]) {
  if (!sbNode.image) {
    return fills;
  }

  const uint8ArrayData = new Uint8Array(sbNode.image.data);
  const imageHash = figma.createImage(uint8ArrayData).hash;
  fills.push({
    type: 'IMAGE',
    opacity: 1,
    blendMode: 'NORMAL',
    scaleMode: 'FILL',
    imageHash: imageHash,
  });
}

export function prepareFullWidthHeightAttr(context: RenderContext, sbNode: CElementNode | CPseudoElementNode) {
  const { width, minWidth, height, minHeight } = sbNode.styleRules;
  sbNode.isFullWidth = width === '100%' || width === '100vw' || minWidth === '100%' || minWidth === '100vw';
  sbNode.isFullHeight = height === '100%' || height === '100vh' || minHeight === '100%' || minHeight === '100vh';
}

export function prepareBorderWidths({
  borderBottomWidth,
  borderLeftWidth,
  borderTopWidth,
  borderRightWidth,
}: MyStyles) {
  return {
    borderBottomWidth: sizeWithUnitToPx(borderBottomWidth as string),
    borderLeftWidth: sizeWithUnitToPx(borderLeftWidth as string),
    borderTopWidth: sizeWithUnitToPx(borderTopWidth as string),
    borderRightWidth: sizeWithUnitToPx(borderRightWidth as string),
  } as BorderWidths;
}

export function applyBordersToEffects(
  node: FrameNode | GroupNode,
  {
    borderBottomColor,
    borderBottomStyle,
    borderLeftColor,
    borderLeftStyle,
    borderTopColor,
    borderTopStyle,
    borderRightColor,
    borderRightStyle,
  }: MyStyles,
  { borderBottomWidth, borderLeftWidth, borderTopWidth, borderRightWidth }: BorderWidths,
  effects: Effect[],
) {
  const borderMapping: BorderMapping[] = [
    {
      color: borderBottomColor,
      style: borderBottomStyle,
      width: borderBottomWidth,
      x: 0,
      y: -1,
    },
    {
      color: borderLeftColor,
      style: borderLeftStyle,
      width: borderLeftWidth,
      x: 1,
      y: 0,
    },
    {
      color: borderTopColor,
      style: borderTopStyle,
      width: borderTopWidth,
      x: 0,
      y: 1,
    },
    {
      color: borderRightColor,
      style: borderRightStyle,
      width: borderRightWidth,
      x: -1,
      y: 0,
    },
  ];

  // If all borders are the same, we could apply real borders with strokes.
  if (areBordersTheSame(borderMapping) && !isGroup(node)) {
    const borderWidth = borderTopWidth;
    if (borderTopStyle !== 'none' && borderWidth !== 0) {
      node.strokeAlign = 'INSIDE';
      node.strokeWeight = borderWidth;
      const { r, g, b, a } = cssRGBAToFigmaValue(borderTopColor as string);
      node.strokes = [
        {
          type: 'SOLID',
          color: { r, g, b },
          opacity: a,
        },
      ];
    }
  } else {
    for (const { color, style, width, x, y } of borderMapping) {
      if (style !== 'none' && width !== 0) {
        const { r, g, b, a } = cssRGBAToFigmaValue(color as string);
        effects.push({
          type: 'INNER_SHADOW',
          spread: 0,
          radius: 0,
          color: { r, g, b, a: a },
          offset: {
            x: x * width,
            y: y * width,
          },
          visible: true,
          blendMode: 'NORMAL',
        });
      }
    }
  }
}

const shadowRegexStr = `${rgbaRegex}\\s+${sizeRegex}\\s+${sizeRegex}\\s+${sizeRegex}\\s+${sizeRegex}(\\s+(inset))?`;
const shadowRegex = new RegExp(shadowRegexStr, 'g');

export function applyShadowToEffects(
  boxShadow: string,
  effects: Effect[],
  node: FrameNode | GroupNode,
  fills: Paint[],
) {
  if (boxShadow === 'none') {
    return false;
  }

  let match: RegExpExecArray | null;
  let matchedAtLeastOne = false;
  let forceClipContents = false;
  while ((match = shadowRegex.exec(boxShadow))) {
    if (isGroup(node)) {
      console.warn(
        'Node is a GroupNode with a box shadow to apply, which is not supposed to happen. Bug? Ignoring the shadow. Node name:',
        node.name,
      );
      return forceClipContents;
    }
    matchedAtLeastOne = true;

    const { r, g, b, a } = rgbaRawMatchToFigma(match[1], match[2], match[3], match[5]);
    const x = sizeWithUnitToPx(match[6]);
    const y = sizeWithUnitToPx(match[8]);
    const blur = sizeWithUnitToPx(match[10]);
    const spread = sizeWithUnitToPx(match[12]);
    if (spread) {
      // Should add fill if no fill yet + enable clip content
      if (!fills.length) {
        fills.push({
          type: 'SOLID',
          color: { r: 1, g: 0, b: 1 },
          opacity: 0.00001,
        });
      }
      forceClipContents = true;
      if (!node.clipsContent) {
        node.clipsContent = true;
      }
    }
    const hasInner = match[15] === 'inset';
    effects.push({
      type: hasInner ? 'INNER_SHADOW' : 'DROP_SHADOW',
      spread,
      radius: blur,
      color: { r, g, b, a },
      offset: {
        x,
        y,
      },
      visible: true,
      blendMode: 'NORMAL',
    });
  }

  if (!matchedAtLeastOne) {
    console.warn('Incorrect box-shadow value from CSS:', boxShadow);
  }
  return forceClipContents;
}

interface Paddings {
  paddingBottom: number;
  paddingLeft: number;
  paddingTop: number;
  paddingRight: number;
}

export function preparePaddings(
  styles: MyStyles,
  { borderBottomWidth, borderLeftWidth, borderTopWidth, borderRightWidth }: BorderWidths,
) {
  const { paddingBottom, paddingLeft, paddingTop, paddingRight } = styles;
  // In figma, inside borders are on top of the padding, although in CSS it's an extra layer.
  // So we increase the padding to cover the borders. It also affects the width/height.
  return {
    paddingBottom: sizeWithUnitToPx(paddingBottom as string) + borderBottomWidth,
    paddingLeft: sizeWithUnitToPx(paddingLeft as string) + borderLeftWidth,
    paddingTop: sizeWithUnitToPx(paddingTop as string) + borderTopWidth,
    paddingRight: sizeWithUnitToPx(paddingRight as string) + borderRightWidth,
  } as Paddings;
}

export interface Margins {
  marginBottom: number;
  marginLeft: number;
  marginTop: number;
  marginRight: number;
}

export function prepareMargins(sbNode: CElementNode | CPseudoElementNode) {
  const { marginBottom, marginLeft, marginTop, marginRight } = sbNode.styles;
  const {
    marginBottom: mBottomRule,
    marginLeft: mLeftRule,
    marginTop: mTopRule,
    marginRight: mRightRule,
  } = sbNode.styleRules;
  return {
    marginBottom: mBottomRule === 'auto' ? 0 : sizeWithUnitToPx(marginBottom as string),
    marginLeft: mLeftRule === 'auto' ? 0 : sizeWithUnitToPx(marginLeft as string),
    marginTop: mTopRule === 'auto' ? 0 : sizeWithUnitToPx(marginTop as string),
    marginRight: mRightRule === 'auto' ? 0 : sizeWithUnitToPx(marginRight as string),
  } as Margins;
}

export function wrapWithMargin(
  context: RenderContext,
  node: FrameNode | GroupNode,
  sbNode: CElementNode | CPseudoElementNode,
  margins: Margins | undefined,
) {
  const { figmaParentNode, sbParentNode } = context;

  // TODO `margin: auto` has various special behaviors depending on where it is used (block, flex, position absolute...)
  // I should look for documentation online listing those behaviors to implement them here.

  let { marginBottom = 0, marginLeft = 0, marginTop = 0, marginRight = 0 } = margins || {};
  if (marginBottom === 0 && marginLeft === 0 && marginTop === 0 && marginRight === 0) {
    return { wrapperNode: node, innerNode: node };
  }

  // Let's support a special case of negative margin: when we can reduce the parent padding instead.
  if (sbParentNode?.children) {
    if (marginTop < 0 && sbParentNode.children[0] === sbNode) {
      figmaParentNode.paddingTop = Math.max(0, figmaParentNode.paddingTop + marginTop);
    }
    if (marginLeft < 0 && sbParentNode.children[0] === sbNode) {
      figmaParentNode.paddingLeft = Math.max(0, figmaParentNode.paddingLeft + marginLeft);
    }
    if (marginBottom < 0 && sbParentNode.children[sbParentNode.children.length - 1] === sbNode) {
      figmaParentNode.paddingBottom = Math.max(0, figmaParentNode.paddingBottom + marginBottom);
    }
    if (marginRight < 0 && sbParentNode.children[sbParentNode.children.length - 1] === sbNode) {
      figmaParentNode.paddingRight = Math.max(0, figmaParentNode.paddingRight + marginRight);
    }
  }

  // Negative margin is not supported with the current approach (except the case above).
  // We could use absolute position on the wrapper to support negative margins, but we would lose the hug contents responsiveness, e.g. having the parent adapt to the child text length.
  if (marginBottom < 0) marginBottom = 0;
  if (marginLeft < 0) marginLeft = 0;
  if (marginTop < 0) marginTop = 0;
  if (marginRight < 0) marginRight = 0;

  // At least one of the borders has margin. Let's wrap with a frame that will use padding instead, without borders, to simulate the margin.
  // Margin collapsing may be added later.
  const wrapper = withDefaultProps(figma.createFrame());
  wrapper.name = 'Margin wrapper';
  if (marginBottom > 0) wrapper.paddingBottom = marginBottom;
  if (marginLeft > 0) wrapper.paddingLeft = marginLeft;
  if (marginTop > 0) wrapper.paddingTop = marginTop;
  if (marginRight > 0) wrapper.paddingRight = marginRight;

  // Copy the node layout
  copyAutoLayout(wrapper, node);
  resizeNode(wrapper, node.width + marginLeft + marginRight, node.height + marginTop + marginBottom);

  wrapper.appendChild(node);
  return { wrapperNode: wrapper, innerNode: node };
}

function copyAutoLayout(node: FrameNode, fromNode: FrameNode | GroupNode, copySize = false) {
  node.layoutMode = isGroup(fromNode) ? 'HORIZONTAL' : fromNode.layoutMode;
  node.layoutGrow = fromNode.layoutGrow;
  node.layoutAlign = fromNode.layoutAlign;
  if (!isGroup(fromNode)) {
    node.primaryAxisSizingMode = fromNode.primaryAxisSizingMode;
    node.counterAxisSizingMode = fromNode.counterAxisSizingMode;
    node.primaryAxisAlignItems = fromNode.primaryAxisAlignItems;
    node.counterAxisAlignItems = fromNode.counterAxisAlignItems;
  }
  if (copySize) {
    resizeNode(node, fromNode.width, fromNode.height);
  }
}

export function applyAutoLayout(
  node: FrameNode | GroupNode,
  context: RenderContext,
  sbNode: CElementNode | CPseudoElementNode,
  paddings: Paddings,
  svgNode: FrameNode | GroupNode | undefined,
  w: number,
  h: number,
) {
  const { figmaParentNode } = context;
  const { display, flexDirection, position } = sbNode.styles;
  const { isFullWidth, isFullHeight } = sbNode;
  const { paddingBottom, paddingLeft, paddingTop, paddingRight } = paddings;
  const { width, height } = sbNode.styleRules;
  const forceFixedWidth = !!svgNode || (!!width && !isFullWidth);
  const forceFixedHeight = !!svgNode || (!!height && !isFullHeight);

  // For SVG nodes, we don't apply auto-layout. For the rest, we do.
  const svgNodeHasWrapper = isFrame(svgNode?.children[0]);
  if ((!svgNode || svgNodeHasWrapper) && !isGroup(node)) {
    node.layoutMode = display === 'flex' && flexDirection === 'row' ? 'HORIZONTAL' : 'VERTICAL';
  }

  applyFlexWidthHeight(node, context, sbNode, isFullWidth, isFullHeight, forceFixedWidth, forceFixedHeight);

  if (!isGroup(node)) {
    if (paddingBottom) node.paddingBottom = paddingBottom;
    if (paddingLeft) node.paddingLeft = paddingLeft;
    if (paddingTop) node.paddingTop = paddingTop;
    if (paddingRight) node.paddingRight = paddingRight;
  }

  if (!!svgNode && (!forceFixedWidth || !forceFixedHeight)) {
    console.warn('A SVG node does not have a fixed size. This is a case to study to ensure we render it well.');
    console.warn('Node name:', node.name);
  }

  if (position === 'absolute' && (isFullWidth || isFullHeight)) {
    const w2 = isFullWidth ? figmaParentNode.width : w;
    const h2 = isFullHeight ? figmaParentNode.height : h;
    resizeNode(node, w2, h2);
  } else if (
    /* node.layoutMode === 'NONE' || */ ((isCElementNode(sbNode) && !sbNode.children?.length) ||
      forceFixedWidth ||
      forceFixedHeight) &&
    !isNaN(w) &&
    !isNaN(h)
  ) {
    if ((forceFixedWidth && forceFixedHeight) || !!svgNode) {
      node.resize(w, h);
    } else {
      resizeNode(node, w, h);
    }
  }
}

const counterAxisStretch = new Set<Property.AlignItems>(['inherit', 'initial', 'normal', 'revert', 'stretch', 'unset']);

export function applyFlexWidthHeight(
  node: FrameNode | TextNode | GroupNode,
  context: RenderContext,
  sbNode: CElementNode | CPseudoElementNode | CTextNode,
  isFullWidth: boolean,
  isFullHeight: boolean,
  forceFixedWidth: boolean,
  forceFixedHeight: boolean,
) {
  const { figmaParentNode, sbParentNode } = context;
  const { display: parentDisplay = 'flex', alignItems: parentAlignItems = 'normal' } = sbParentNode?.styles || {};
  const { display, alignItems, justifyContent, flexGrow, flexBasis, position } = nodeStyles(sbNode, sbParentNode);

  const parentHorizontal = figmaParentNode.layoutMode === 'HORIZONTAL';
  const parentVertical = !parentHorizontal;
  const parentIsInlineOrBlock =
    parentDisplay === 'inline' || parentDisplay === 'inline-block' || parentDisplay === 'block';
  const parentIsFlex = parentDisplay === 'flex' || parentDisplay === 'inline-flex';
  const isInline =
    display.startsWith('inline') && // e.g. inline, inline-block, inline-flex
    parentIsInlineOrBlock; // Inline has effect only if the parent is inline or block

  const widthFillContainer = isFullWidth;
  const heightFillContainer = isFullHeight;

  // Prepare some intermediate states we need to know to calculate the layout
  const isAbsolute = position === 'absolute';
  const parentPrimaryAxisAlreadyHugs = !isAbsolute && figmaParentNode.primaryAxisSizingMode === 'AUTO';
  const parentCounterAxisAlreadyHugs = !isAbsolute && figmaParentNode.counterAxisSizingMode === 'AUTO';

  // Calculate the final states that directly translate into Figma layout properties

  // Fill container on both axes (depends on parent direction)
  const parentPrimaryAxisFillContainer =
    // The normal rule to fill container
    // width/height 100%
    ((parentHorizontal && widthFillContainer) ||
      (parentVertical && heightFillContainer) ||
      // or flex equivalent
      (parentIsFlex && (flexGrow >= 1 || flexBasis === '100%' || flexBasis === '100vw' || flexBasis === '100vh'))) &&
    // Exceptions that could prevent fill container
    !((parentHorizontal && forceFixedWidth) || (parentVertical && forceFixedHeight)) &&
    !parentPrimaryAxisAlreadyHugs;

  const parentCounterAxisFillContainer =
    // The normal rule to fill container
    // width/height 100%
    ((parentHorizontal && heightFillContainer) ||
      (parentVertical && widthFillContainer) ||
      // Parent makes counter axis stretch
      (parentIsFlex && counterAxisStretch.has(parentAlignItems)) ||
      parentIsInlineOrBlock) &&
    // Exceptions that could prevent fill container
    !isInline &&
    !((parentHorizontal && forceFixedHeight) || (parentVertical && forceFixedWidth)) &&
    !parentCounterAxisAlreadyHugs;

  // Translate into Figma properties:
  node.layoutGrow = parentPrimaryAxisFillContainer ? 1 : 0;
  node.layoutAlign = parentCounterAxisFillContainer ? 'STRETCH' : 'INHERIT';

  // auto-layout frame nodes properties, for the relation with their children:

  if (isFrame(node)) {
    const nodeHorizontal = node.layoutMode === 'HORIZONTAL';
    const nodeVertical = !nodeHorizontal;

    const parentAndNodeHaveSameDirection = parentHorizontal === nodeHorizontal;
    const hasChildrenToHug = isCElementNode(sbNode) && !!sbNode.children?.length;

    // Hug contents on both axes (depends on this node direction)
    const nodePrimaryAxisHugContents =
      // The normal rule to hug contents: no fill container in the same axis
      ((parentAndNodeHaveSameDirection && !parentPrimaryAxisFillContainer) ||
        (!parentAndNodeHaveSameDirection && !parentCounterAxisFillContainer)) &&
      // Exceptions that could prevent hug contents
      !((nodeHorizontal && forceFixedWidth) || (nodeVertical && forceFixedHeight)) &&
      hasChildrenToHug;

    const nodeCounterAxisHugContents =
      // The normal rule to hug contents: no fill container in the same axis
      ((parentAndNodeHaveSameDirection && !parentCounterAxisFillContainer) ||
        (!parentAndNodeHaveSameDirection && !parentPrimaryAxisFillContainer)) &&
      // Exceptions that could prevent hug contents
      !((nodeHorizontal && forceFixedHeight) || (nodeVertical && forceFixedWidth)) &&
      hasChildrenToHug;

    // primaryAxisSizingMode = FIXED (AUTO sinon) si pas fixe et :
    // - Enfant vertical && height fill container
    // - ou Enfant horizontal && width fill container
    // - ou pas d'enfants (e.g. <hr />)
    node.primaryAxisSizingMode = nodePrimaryAxisHugContents ? 'AUTO' : 'FIXED';

    // counterAxisSizingMode = FIXED (AUTO sinon) si pas fixe et :
    // - Enfant vertical && width fill container
    // - ou Enfant horizontal && height fill container
    node.counterAxisSizingMode = nodeCounterAxisHugContents ? 'AUTO' : 'FIXED';

    // To adjust based on flex properties like align-items / justify-content
    node.primaryAxisAlignItems = justifyContentToPrimaryAlign[justifyContent] || 'MIN';
    node.counterAxisAlignItems = alignItemsToCounterAlign[alignItems] || 'MIN';
  }
}

// primary axis
const justifyContentToPrimaryAlign: Partial<{
  [K in Property.JustifyContent]: BaseFrameMixin['primaryAxisAlignItems'];
}> = {
  baseline: 'MIN',
  normal: 'MIN',
  center: 'CENTER',
  start: 'MIN',
  end: 'MAX',
  'flex-start': 'MIN',
  'flex-end': 'MIN',
  'space-between': 'SPACE_BETWEEN',
  'space-around': 'SPACE_BETWEEN',
  // stretch: 'MIN',
};
// counter axis
const alignItemsToCounterAlign: Partial<{
  [K in Property.AlignItems]: BaseFrameMixin['counterAxisAlignItems'];
}> = {
  inherit: 'MIN', // stretch
  initial: 'MIN', // stretch
  normal: 'MIN', // stretch
  revert: 'MIN', // stretch
  stretch: 'MIN', // stretch
  unset: 'MIN', // stretch
  baseline: 'MIN',
  center: 'CENTER',
  start: 'MIN',
  end: 'MAX',
};

export function getSvgNode(borders: BorderWidths, paddings: Paddings, sbNode: CElementNode | CPseudoElementNode) {
  const svg = sbNode.svg;
  if (!svg) {
    return;
  }

  const { color } = sbNode.styles;

  // Wrapper required for cases when the svg container has padding, because createNodeFromSvg renders the SVG in the container with the right position (don't try to resize the svg, you will distort it), but it ignores the padding and renders in the whole node area. So the padding should be applied on a parent node.
  const { borderBottomWidth, borderLeftWidth, borderTopWidth, borderRightWidth } = borders;
  const { paddingBottom, paddingLeft, paddingTop, paddingRight } = paddings;
  const shouldWrap =
    borderBottomWidth > 0 ||
    borderLeftWidth > 0 ||
    borderTopWidth > 0 ||
    borderRightWidth > 0 ||
    paddingBottom > 0 ||
    paddingLeft > 0 ||
    paddingTop > 0 ||
    paddingRight > 0;
  let node = withDefaultProps(figma.createNodeFromSvg(svg) as FrameNode | GroupNode);
  const svgNode = node.children[0] as VectorNode;

  if (shouldWrap) {
    node.name = 'SVG wrapper';
    withDefaultProps(node);
    if (!isGroup(node)) {
      node.layoutMode = 'VERTICAL';
    }
    node.layoutGrow = 1;
    node.layoutAlign = 'STRETCH';
    if (!isGroup(node)) {
      node.primaryAxisSizingMode = 'FIXED';
      node.counterAxisSizingMode = 'FIXED';
    }
    const svgWrapper = figma.createFrame();
    svgWrapper.appendChild(node);
    node = svgWrapper;
  }

  // Some properties like fill should be applied directly to the SVG.
  svgNode.fills = appendBackgroundColor(color, []);

  // Center SVG in the container. We consider background images are centered by default. To review if we have different cases.
  // We set it in the style to let applyAutoLayout translate into Figma props with the rest (e.g. paddings).
  sbNode.styles.alignItems = 'center';
  sbNode.styles.justifyContent = 'center';
  return node;
}

export function applyTransform(transform: Properties['transform'], node: FrameNode | GroupNode) {
  if (transform === 'none') {
    return;
  }
  const numberRegexStr = '-?(\\d+.)?\\d+(e-?\\d+)?';
  const matrixRegexStr = `matrix\\((${numberRegexStr}),\\s*(${numberRegexStr}),\\s*(${numberRegexStr}),\\s*(${numberRegexStr}),\\s*(${numberRegexStr}),\\s*(${numberRegexStr})\\)`;
  const matrixRegex = new RegExp(matrixRegexStr);
  const match = matrixRegex.exec(transform as string);
  if (match == null) {
    console.warn('Incorrect transform value from CSS:', transform);
    return;
  }
  const a = parseFloat(match[1]);
  const b = parseFloat(match[4]);
  const c = parseFloat(match[7]);
  const d = parseFloat(match[10]);
  const tx = parseFloat(match[13]);
  const ty = parseFloat(match[16]);

  // https://developer.mozilla.org/fr/docs/Web/CSS/transform-function/matrix()
  // https://www.figma.com/plugin-docs/api/Transform/#docsNav
  const transformationMatrix: Transform = [
    [a, c, tx],
    [b, d, ty],
  ];

  try {
    node.relativeTransform = transformationMatrix;
  } catch (err) {
    console.error(
      'Error while applying relativeTransform. The transformation is ignored and the rendering continues without it.',
    );
    console.error(err);
    // Ignore transform and continue.
  }
}

export function applyRadius(
  node: FrameNode,
  { borderTopLeftRadius, borderTopRightRadius, borderBottomLeftRadius, borderBottomRightRadius }: MyStyles,
) {
  node.topLeftRadius = sizeWithUnitToPx(borderTopLeftRadius as string);
  node.topRightRadius = sizeWithUnitToPx(borderTopRightRadius as string);
  node.bottomLeftRadius = sizeWithUnitToPx(borderBottomLeftRadius as string);
  node.bottomRightRadius = sizeWithUnitToPx(borderBottomRightRadius as string);
}

function prepareAbsoluteConstraints(sbNode: CElementNode | CPseudoElementNode) {
  const { bottom, left, top, right } = sbNode.styles;
  const { marginBottom, marginLeft, marginTop, marginRight } = prepareMargins(sbNode);
  return {
    // replaceNaNWith0 because with display: none, those properties can still contain the original formula like calc(100% - 12px), not calculated until the component is displayed.
    // Also, let's add the margins here. I don't see the difference with top/left/... rules, except it sums up.
    bottom: replaceNaNWith0(sizeWithUnitToPx(bottom as string)) + marginBottom,
    left: replaceNaNWith0(left === 'auto' ? 0 : sizeWithUnitToPx(left as string)) + marginLeft,
    top: replaceNaNWith0(top === 'auto' ? 0 : sizeWithUnitToPx(top as string)) + marginTop,
    right: replaceNaNWith0(sizeWithUnitToPx(right as string)) + marginRight,
  };
}

function replaceNaNWith0(num: number): number {
  return isNaN(num) ? 0 : num;
}

export function resizeNode(node: LayoutNode, width: number, height: number) {
  if (width < 0.01) width = 0.01;
  if (height < 0.01) height = 0.01;
  node.resizeWithoutConstraints(width, height);
}

function setTo0px(frame: FrameNode) {
  resizeNode(frame, 0, 0);

  // https://figmaplugins.slack.com/archives/CM11GSRAT/p1629228050013600?thread_ts=1611754495.005200&cid=CM11GSRAT
  // I found another way to get 0px frame through api.
  // The steps are as follow:
  // 1. Create or get a line / vector 0px width or height;
  // 2. Create a frame and append the line in this frame (the size doesn't matter)
  // 3. Change frame frame.layoutMode = "HORIZONTAL" | "VERTICAL"
  // 4. Change frame back to none frame.layoutMode = "NONE"  to have basic frame.
  // 5. Append the items you need in this frame.
  // ** In case you leave the frame.layoutMode !== "NONE" , then you'll need to change also one or both of the following props:
  // frame.primaryAxisSizingMode = "FIXED"
  // frame.counterAxisSizingMode = "FIXED"
}

export function appendAbsolutelyPositionedNode({
  node,
  sbNode,
  figmaParentNode,
  absoluteAncestor,
  absoluteAncestorBorders,
}: AbsoluteElementToAdd) {
  let wrapper: FrameNode | GroupNode | undefined;
  if (figmaParentNode.layoutMode === 'NONE') {
    // No need to wrap if the parent is not auto-layout (e.g. an absolute position right within an absolutely positioned node)
    wrapper = node;
  } else {
    wrapper = withDefaultProps(figma.createFrame());
    wrapper.name = 'Absolute position wrapper';
    // wrapper.layoutAlign = 'STRETCH'; // Optional, but may harm more than help.
    // So we set to transparent. The tradeoff is that there is 1px shift for the rest.
    // We could work around it by reducing paddings, margins... (if any) by 1px (not implemented)
    setTo0px(wrapper);

    wrapper.appendChild(node);
  }

  figmaParentNode.appendChild(wrapper);

  const { isFullWidth, isFullHeight, styles, styleRules } = sbNode;

  // if (node.name === 'span.v-badge__badge.success') {
  //   console.log('I want to debug here');
  //   debugger;
  // }

  const { width, height } = node;

  // Sum the x and y coordinates of intermediates nodes to have the distance between the absolute node and the ancestor.
  let n: (BaseNode & ChildrenMixin) | null = wrapper;
  let dx = 0,
    dy = 0;
  while (isLayout(n) && n !== absoluteAncestor) {
    dx += n.x;
    dy += n.y;
    n = n.parent;
  }

  if (!n) {
    // absoluteAncestor not found among the parents in the tree
    console.warn(
      'absoluteAncestor',
      absoluteAncestor.name,
      'not found in ancestors of',
      node.name,
      '- using a shift of 0px for x/y to render anyway.',
    );
    dx = 0;
    dy = 0;
  }

  const { width: ancestorWidth, height: ancestorHeight } = absoluteAncestor;
  const { bottom, left, top, right } = prepareAbsoluteConstraints(sbNode);
  const {
    bottom: ruleBottom = 'auto',
    left: ruleLeft = 'auto',
    top: ruleTop = 'auto',
    right: ruleRight = 'auto',
  } = styleRules;
  const attachTop = ruleTop !== 'auto' || isFullHeight;
  const attachBottom = ruleBottom !== 'auto' || isFullHeight;
  const attachLeft = ruleLeft !== 'auto' || isFullWidth;
  const attachRight = ruleRight !== 'auto' || isFullWidth;
  let vertical: ConstraintType = 'MIN';
  let horizontal: ConstraintType = 'MIN';
  let resizeWidth = 0,
    resizeHeight = 0;
  if (attachTop && attachBottom) {
    node.y = -dy + absoluteAncestorBorders.borderTopWidth + top;
    resizeHeight =
      ancestorHeight -
      absoluteAncestorBorders.borderTopWidth -
      absoluteAncestorBorders.borderBottomWidth -
      top -
      bottom;
    vertical = 'CENTER';
  } else if (attachBottom) {
    node.y = -dy + ancestorHeight - absoluteAncestorBorders.borderBottomWidth - bottom - height;
    vertical = 'MAX';
  } else {
    // defaults to attach top
    node.y = -dy + absoluteAncestorBorders.borderTopWidth + top;
    vertical = 'MIN';
  }

  if (attachLeft && attachRight) {
    node.x = -dx + absoluteAncestorBorders.borderLeftWidth + left;
    resizeWidth =
      ancestorWidth - absoluteAncestorBorders.borderLeftWidth - absoluteAncestorBorders.borderRightWidth - left - right;
    horizontal = 'CENTER';
  } else if (attachRight) {
    node.x = -dx + ancestorWidth - absoluteAncestorBorders.borderRightWidth - right - width;
    horizontal = 'MAX';
  } else {
    // defaults to attach left
    node.x = -dx + absoluteAncestorBorders.borderLeftWidth + left;
    horizontal = 'MIN';
  }

  if (resizeWidth > 0 || resizeHeight > 0) {
    resizeNode(node, resizeWidth || node.width, resizeHeight || node.height);
  }

  if (!isGroup(node)) {
    node.constraints = {
      horizontal,
      vertical,
    };
  }
}

export function sizeWithUnitToPx(size: NonNullable<Property.Width> | string | number) {
  if (size == null) return 0;
  return parseInt(size as string);
}

export function nodeStyles(sbNode: CNode, sbParentNode: CElementNode | null) {
  return (isCTextNode(sbNode) ? sbParentNode?.styles || cssDefaults : sbNode.styles) as MyStyles | MyStylesPE;
}

function isNumeric(n: string) {
  return !isNaN(parseFloat(n)) && isFinite(n as any);
}

function roundHundred(num: number) {
  return Math.round(num / 100) * 100;
}

function rgbaRawMatchToFigma(rRaw: string, gRaw: string, bRaw: string, aRaw: string) {
  const r = parseFloat(rRaw) / 255;
  const g = parseFloat(gRaw) / 255;
  const b = parseFloat(bRaw) / 255;
  const a = aRaw ? parseFloat(aRaw) : 1;
  return { r, g, b, a };
}

export function withDefaultProps<T extends FrameNode | TextNode | ComponentNode | GroupNode>(node: T) {
  if (!isGroup(node)) {
    if (!isText(node)) {
      node.clipsContent = false;
    }
    node.fills = [];
  }
  node.setRelaunchData({ preview: '' });
  return node;
}

export function removeNode(node: BaseNode | Nil) {
  if (node && !node.removed) {
    node.remove();
  }
}
