import { isLayout } from './canvas-utils';
import { BorderWidths, RenderContext } from './import-model';
import { CElementNode, CNode, CPseudoElementNode, isCElementNode, isCPseudoElementNode, isCTextNode, MyStyles, Properties, Property } from './sb-serialize.model';

const loadedFonts = new Map<string, Promise<void>>();

export async function ensureFontIsLoaded(family: string, style: string) {
  const fontCacheKey = `${family}_${style}`;
  const newFont: FontName = { family, style };
  if (!loadedFonts.has(fontCacheKey)) {
    const p = figma.loadFontAsync(newFont);
    loadedFonts.set(fontCacheKey, p);
    // Loading fonts takes time. We are in a loop and we don't want other loop runs to also load the font. So the cache returns the promise of the font we are already loading, so that everybody awaits a shared font loading.
    await p;
  } else {
    await loadedFonts.get(fontCacheKey);
  }
  return newFont;
}

export function cssFontWeightToFigmaValue(fontWeight: string) {
  if (!isNumeric(fontWeight)) {
    throw new Error('Unsupported textual font weight from CSS for now. To implement.');
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

export function cssTextAlignToFigmaValue(textAlign: Properties['textAlign']): "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED" {
  switch (textAlign) {
    default:
    case 'start':
    case 'left':
      return 'LEFT';
    case 'center':
      return 'CENTER';
    case 'right':
    case 'end':
      return 'RIGHT';
    case 'justify':
      return 'JUSTIFIED';
  }
}

const rgbaRegex = 'rgba?\\((\\d{1,3}),\\s*(\\d{1,3}),\\s*(\\d{1,3})(,\\s*(\\d*\\.?\\d+))?\\)';
const sizeRegex = '(-?\\d*\\.?\\d+)(px)';

export function cssRGBAToFigmaValue(rgb: string): { r: number, g: number, b: number, a: number; } {
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
      if (color !== latestColor || style !== latestStyle || width !== latestWidth)
        return false;
    } else {
      first = false;
    }
    latestColor = color;
    latestStyle = style;
    latestWidth = width;
  }
  return true;
}

export function applyBackgroundColor(node: FrameNode | VectorNode, backgroundColor: Properties['backgroundColor'], opacity: Property.Opacity) {
  const { r, g, b, a } = cssRGBAToFigmaValue(backgroundColor as string);
  node.fills = a > 0 ? [{
    type: 'SOLID',
    color: { r, g, b },
    opacity: a * parseInt(opacity as string) ?? 1,
  }] : [];
}

export function prepareFullWidthHeightAttr(context: RenderContext, sbNode: CElementNode | CPseudoElementNode) {
  const { width, minWidth, height, minHeight } = sbNode.styleRules;
  sbNode.isFullWidth = width === '100%' || width === '100vw' || minWidth === '100%' || minWidth === '100vw';
  sbNode.isFullHeight = height === '100%' || height === '100vh' || minHeight === '100%' || minHeight === '100vh';
  if (isCPseudoElementNode(sbNode)) {
    debugger;
  }
}

export function prepareBorderWidths({ borderBottomWidth, borderLeftWidth, borderTopWidth, borderRightWidth }: MyStyles) {
  return {
    borderBottomWidth: sizeWithUnitToPx(borderBottomWidth as string),
    borderLeftWidth: sizeWithUnitToPx(borderLeftWidth as string),
    borderTopWidth: sizeWithUnitToPx(borderTopWidth as string),
    borderRightWidth: sizeWithUnitToPx(borderRightWidth as string),
  } as BorderWidths;
}

export function applyBordersToEffects(node: FrameNode, { borderBottomColor, borderBottomStyle, borderLeftColor, borderLeftStyle, borderTopColor, borderTopStyle, borderRightColor, borderRightStyle, opacity }: MyStyles, { borderBottomWidth, borderLeftWidth, borderTopWidth, borderRightWidth }: BorderWidths, effects: Effect[]) {
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
  const op = parseInt(opacity as string) ?? 1;

  // If all borders are the same, we could apply real borders with strokes.
  if (areBordersTheSame(borderMapping)) {
    const borderWidth = borderTopWidth;
    if (borderTopStyle !== 'none' && borderWidth !== 0) {
      node.strokeAlign = 'INSIDE';
      node.strokeWeight = borderWidth;
      const { r, g, b, a } = cssRGBAToFigmaValue(borderTopColor as string);
      node.strokes = [{
        type: 'SOLID',
        color: { r, g, b },
        opacity: a * op,
      }];
    }
  } else {
    for (const { color, style, width, x, y } of borderMapping) {
      if (style !== 'none' && width !== 0) {
        const { r, g, b, a } = cssRGBAToFigmaValue(color as string);
        effects.push({
          type: 'INNER_SHADOW',
          spread: 0,
          radius: 0,
          color: { r, g, b, a: a * op },
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

const shadowRegex = `${rgbaRegex}\\s+${sizeRegex}\\s+${sizeRegex}\\s+${sizeRegex}\\s+${sizeRegex}(\\s+(inset))?`;

export function applyShadowToEffects(boxShadow: string, effects: Effect[]) {
  if (boxShadow === 'none') {
    return;
  }
  const matchShadow = new RegExp(shadowRegex);
  const match = matchShadow.exec(boxShadow);
  if (match == null) {
    console.warn('Incorrect box-shadow value from CSS:', boxShadow);
    return;
  }
  const { r, g, b, a } = rgbaRawMatchToFigma(match[1], match[2], match[3], match[5]);
  const x = sizeWithUnitToPx(match[6]);
  const y = sizeWithUnitToPx(match[8]);
  const blur = sizeWithUnitToPx(match[10]);
  const spread = sizeWithUnitToPx(match[12]);
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

interface Paddings {
  paddingBottom: number;
  paddingLeft: number;
  paddingTop: number;
  paddingRight: number;
}

export function preparePaddings(styles: MyStyles, { borderBottomWidth, borderLeftWidth, borderTopWidth, borderRightWidth }: BorderWidths) {
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

export function prepareMargins({ marginBottom, marginLeft, marginTop, marginRight }: MyStyles) {
  return {
    marginBottom: sizeWithUnitToPx(marginBottom as string),
    marginLeft: sizeWithUnitToPx(marginLeft as string),
    marginTop: sizeWithUnitToPx(marginTop as string),
    marginRight: sizeWithUnitToPx(marginRight as string),
  } as Margins;
}

export function appendMargins({ figmaParentNode, sbParentNode }: RenderContext, sbNode: CNode, margins: Margins | undefined, previousMargins: Margins | undefined) {
  if (isCPseudoElementNode(sbNode)) {
    // Hack because we can't recognize margin: auto with computed CSS.
    // Let's assume it's typically used with pseudo elements.
    // Later, to replace with a check of the source CSS rule.
    return;
  }
  const { display } = nodeStyles(sbNode, sbParentNode);
  let margin = 0, width = 0, height = 0;
  if (figmaParentNode.layoutMode === 'HORIZONTAL') {
    margin = (previousMargins?.marginRight || 0) + (margins?.marginLeft || 0);
    width = margin;
    height = 1;
  } else if (figmaParentNode.layoutMode === 'VERTICAL') {
    const m1 = previousMargins?.marginBottom || 0;
    const m2 = margins?.marginTop || 0;
    margin = display === 'block' ? Math.max(m1, m2) : m1 + m2;
    width = 1;
    height = margin;
  }
  if (margin > 0) {
    const space = figma.createFrame();
    space.name = `Margin ${margin}px`;
    // Add a transparent frame taking the margin space, stretching in counter axis.
    space.resizeWithoutConstraints(width, height);
    space.fills = [{
      type: 'SOLID',
      color: { r: 1, g: 1, b: 1 },
      opacity: 0,
    }];
    space.layoutAlign = 'STRETCH';
    figmaParentNode.appendChild(space);
  }
}

export function applyAutoLayout(node: FrameNode, context: RenderContext, sbNode: CElementNode | CPseudoElementNode, paddings: Paddings, svgNode: FrameNode | undefined, w: number, h: number) {
  const { figmaParentNode } = context;
  const { display, flexDirection, position } = sbNode.styles;
  const { isFullWidth, isFullHeight } = sbNode;
  const { paddingBottom, paddingLeft, paddingTop, paddingRight } = paddings;
  const { width, height } = sbNode.styleRules;
  const forceFixedWidth = !!svgNode || (!!width && !isFullWidth);
  const forceFixedHeight = !!svgNode || (!!height && !isFullHeight);

  // For SVG nodes, we don't apply auto-layout. For the rest, we do.
  if (!svgNode) {
    node.layoutMode = display === 'flex' && flexDirection === 'row'
      ? 'HORIZONTAL' : 'VERTICAL';
  }

  applyFlexWidthHeight(node, context, sbNode, w, h, isFullWidth, isFullHeight, forceFixedWidth, forceFixedHeight);

  if (paddingBottom) node.paddingBottom = paddingBottom;
  if (paddingLeft) node.paddingLeft = paddingLeft;
  if (paddingTop) node.paddingTop = paddingTop;
  if (paddingRight) node.paddingRight = paddingRight;

  // if (node.name === 'i:after') {
  //   console.log('I want to debug here');
  //   debugger;
  // }

  if (!!svgNode && (!forceFixedWidth || !forceFixedHeight)) {
    console.warn('A SVG node does not have a fixed size. This is a case to study to ensure we render it well.');
    console.warn('Node name:', node.name);
  }

  if (position === 'absolute' && (isFullWidth || isFullHeight)) {
    const w2 = isFullWidth ? figmaParentNode.width : w;
    const h2 = isFullHeight ? figmaParentNode.height : h;
    node.resizeWithoutConstraints(w2, h2);
  } else if ((/* node.layoutMode === 'NONE' || */  (isCElementNode(sbNode) && !sbNode.children?.length) || forceFixedWidth || forceFixedHeight) && !isNaN(w) && !isNaN(h)) {
    if ((forceFixedWidth && forceFixedHeight) || !!svgNode) {
      node.resize(w, h);
    } else {
      node.resizeWithoutConstraints(w, h);
    }
  }
}

const counterAxisStretch = new Set<Property.AlignItems>(['inherit', 'initial', 'normal', 'revert', 'stretch', 'unset']);

function applyFlexWidthHeight(node: FrameNode, context: RenderContext, sbNode: CElementNode | CPseudoElementNode, w: number, h: number, isFullWidth: boolean, isFullHeight: boolean, forceFixedWidth: boolean, forceFixedHeight: boolean) {
  const { figmaParentNode, sbParentNode } = context;
  const { display: parentDisplay = 'flex', alignItems: parentAlignItems = 'normal' } = sbParentNode?.styles || {};
  const { display, alignItems, justifyContent, flexGrow, flexBasis, position } = sbNode.styles;

  const parentHorizontal = figmaParentNode.layoutMode === 'HORIZONTAL';
  const parentVertical = !parentHorizontal;
  const nodeHorizontal = node.layoutMode === 'HORIZONTAL';
  const nodeVertical = !nodeHorizontal;
  const parentIsInlineOrBlock = parentDisplay === 'inline' || parentDisplay === 'inline-block' || parentDisplay === 'block';
  const parentIsFlex = parentDisplay === 'flex' || parentDisplay === 'inline-flex';
  const isInline = display.startsWith('inline') // e.g. inline, inline-block, inline-flex
    && parentIsInlineOrBlock; // Inline has effect only if the parent is inline or block
  const parentAndNodeHaveSameDirection = parentHorizontal === nodeHorizontal;

  const hasChildrenToHug = isCElementNode(sbNode) && !!sbNode.children?.length;

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
    (
      // width/height 100%
      (parentHorizontal && widthFillContainer || parentVertical && heightFillContainer)
      // or flex equivalent
      || (parentIsFlex && (flexGrow >= 1 || flexBasis === '100%' || flexBasis === '100vw' || flexBasis === '100vh'))
    )
    // Exceptions that could prevent fill container
    && !(parentHorizontal && forceFixedWidth || parentVertical && forceFixedHeight)
    && !parentPrimaryAxisAlreadyHugs;

  const parentCounterAxisFillContainer =
    // The normal rule to fill container
    (
      // width/height 100%
      (parentHorizontal && heightFillContainer || parentVertical && widthFillContainer)
      // Parent makes counter axis stretch
      || (parentIsFlex && counterAxisStretch.has(parentAlignItems))
      || parentIsInlineOrBlock
    )
    // Exceptions that could prevent fill container
    && !isInline
    && !(parentHorizontal && forceFixedHeight || parentVertical && forceFixedWidth)
    && !parentCounterAxisAlreadyHugs;

  // Hug contents on both axes (depends on this node direction)
  const nodePrimaryAxisHugContents =
    // The normal rule to hug contents: no fill container in the same axis
    ((parentAndNodeHaveSameDirection && !parentPrimaryAxisFillContainer) || (!parentAndNodeHaveSameDirection && !parentCounterAxisFillContainer))
    // Exceptions that could prevent hug contents
    && !(nodeHorizontal && forceFixedWidth || nodeVertical && forceFixedHeight)
    && hasChildrenToHug;

  const nodeCounterAxisHugContents =
    // The normal rule to hug contents: no fill container in the same axis
    ((parentAndNodeHaveSameDirection && !parentCounterAxisFillContainer) || (!parentAndNodeHaveSameDirection && !parentPrimaryAxisFillContainer))
    // Exceptions that could prevent hug contents
    && !(nodeHorizontal && forceFixedHeight || nodeVertical && forceFixedWidth)
    && hasChildrenToHug;

  // if (node.name === 'i:after') {
  //   console.log('I want to debug here');
  //   debugger;
  // }


  // Translate into Figma properties:
  node.layoutGrow = parentPrimaryAxisFillContainer ? 1 : 0;
  node.layoutAlign = parentCounterAxisFillContainer ? 'STRETCH' : 'INHERIT';

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
  node.primaryAxisAlignItems = justifyContentMap[justifyContent] || 'MIN';
  node.counterAxisAlignItems = alignItemsMap[alignItems] || 'MIN';
}

// primary axis
const justifyContentMap: Partial<{
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
const alignItemsMap: Partial<{
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

function svgFromBackground(sbNode: CElementNode | CPseudoElementNode) {
  const { backgroundImage } = sbNode.styles;
  if (backgroundImage === 'none') {
    return;
  }
  // Extract svg string
  const dataUrlRegex = /^url\("data:[^,]+,(.*?)"\)$/;
  const match = dataUrlRegex.exec(backgroundImage as string);
  if (match == null || !match[1]) {
    console.warn('Incorrect background-image value from CSS:', backgroundImage);
    return;
  }
  return decodeURIComponent(match[1]);
}

function svgFromFontIcon(sbNode: CElementNode | CPseudoElementNode) {
  return isCPseudoElementNode(sbNode) && sbNode.isFontIcon ? sbNode.svg : undefined;
}

export function getSvgNodeFromBackground(backgroundImage: Properties['backgroundImage'], borders: BorderWidths, paddings: Paddings, sbNode: CElementNode | CPseudoElementNode) {
  const svg = svgFromBackground(sbNode) || svgFromFontIcon(sbNode);
  if (!svg) {
    return;
  }

  const { color, opacity } = sbNode.styles;

  // Wrapper required for cases when the svg container has padding, because createNodeFromSvg renders the SVG in the container with the right position (don't try to resize the svg, you will distort it), but it ignores the padding and renders in the whole node area. So the padding should be applied on a parent node.
  const { borderBottomWidth, borderLeftWidth, borderTopWidth, borderRightWidth } = borders;
  const { paddingBottom, paddingLeft, paddingTop, paddingRight } = paddings;
  const shouldWrap = borderBottomWidth > 0 || borderLeftWidth > 0 || borderTopWidth > 0 || borderRightWidth > 0 || paddingBottom > 0 || paddingLeft > 0 || paddingTop > 0 || paddingRight > 0;
  let node = figma.createNodeFromSvg(svg);
  const svgNode = node.children[0] as VectorNode;

  if (shouldWrap) {
    node.name = 'SVG wrapper';
    node.layoutMode = 'VERTICAL';
    node.layoutGrow = 1;
    node.layoutAlign = 'STRETCH';
    node.primaryAxisSizingMode = 'FIXED';
    node.counterAxisSizingMode = 'FIXED';
    const svgWrapper = figma.createFrame();
    svgWrapper.appendChild(node);
    node = svgWrapper;
  }

  // Some properties like fill should be applied directly to the SVG.
  applyBackgroundColor(svgNode, color, opacity);

  // Center SVG in the container. We consider background images are centered by default. To review if we have different cases.
  // We set it in the style to let applyAutoLayout translate into Figma props with the rest (e.g. paddings).
  sbNode.styles.alignItems = 'center';
  sbNode.styles.justifyContent = 'center';
  return node;
}

export function applyTransform(transform: Properties['transform'], node: FrameNode) {
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
    console.error('Error while applying relativeTransform. The transformation is ignored and the rendering continues without it.');
    console.error(err);
    // Ignore transform and continue.
  }
}

export function applyRadius(node: FrameNode, { borderTopLeftRadius, borderTopRightRadius, borderBottomLeftRadius, borderBottomRightRadius }: MyStyles) {
  node.topLeftRadius = sizeWithUnitToPx(borderTopLeftRadius as string);
  node.topRightRadius = sizeWithUnitToPx(borderTopRightRadius as string);
  node.bottomLeftRadius = sizeWithUnitToPx(borderBottomLeftRadius as string);
  node.bottomRightRadius = sizeWithUnitToPx(borderBottomRightRadius as string);
}

function prepareAbsoluteConstraints(styles: MyStyles) {
  const { bottom, left, top, right } = styles;
  return {
    bottom: sizeWithUnitToPx(bottom as string),
    left: sizeWithUnitToPx(left as string),
    top: sizeWithUnitToPx(top as string),
    right: sizeWithUnitToPx(right as string),
  };
}

function setTo0px(frame: FrameNode) {
  frame.resizeWithoutConstraints(0.01, 0.01);

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

export function appendAbsolutelyPositionedNode(node: FrameNode, sbNode: CElementNode | CPseudoElementNode, context: RenderContext) {
  const { figmaParentNode, absoluteAncestor, absoluteAncestorBorders } = context;
  let wrapper: FrameNode | undefined;
  if (figmaParentNode.layoutMode === 'NONE') {
    // No need to wrap if the parent is not auto-layout (e.g. an absolute position right within an absolutely positioned node)
    wrapper = node;
  } else {
    wrapper = figma.createFrame();
    wrapper.name = 'Absolute position wrapper';
    wrapper.layoutAlign = 'STRETCH';
    setTo0px(wrapper);
    // So we set to transparent. The tradeoff is that there is 1px shift for the rest.
    // We could work around it by reducing paddings, margins... (if any) by 1px (not implemented)
    wrapper.fills = [{
      type: 'SOLID',
      color: { r: 1, g: 1, b: 1 },
      opacity: 0,
    }];

    wrapper.clipsContent = false;
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
  let n: BaseNode & ChildrenMixin | null = wrapper;
  let dx = 0, dy = 0;
  while (isLayout(n) && n !== absoluteAncestor) {
    dx += n.x;
    dy += n.y;
    n = n.parent;
  }

  if (!n) { // absoluteAncestor not found among the parents in the tree
    console.warn('absoluteAncestor', absoluteAncestor.name, 'not found in ancestors of', node.name, '- using a shift of 0px for x/y to render anyway.');
    dx = 0;
    dy = 0;
  }

  const { width: parentWidth, height: parentHeight } = absoluteAncestor;
  const { bottom, left, top, right } = prepareAbsoluteConstraints(styles);
  const { bottom: ruleBottom = 'auto', left: ruleLeft = 'auto', top: ruleTop = 'auto', right: ruleRight = 'auto' } = styleRules;
  const attachTop = ruleTop !== 'auto' || isFullHeight;
  const attachBottom = ruleBottom !== 'auto' || isFullHeight;
  const attachLeft = ruleLeft !== 'auto' || isFullWidth;
  const attachRight = ruleRight !== 'auto' || isFullWidth;
  let vertical: ConstraintType = 'MIN';
  let horizontal: ConstraintType = 'MIN';
  if (attachTop && attachBottom) { // old: top === bottom
    const parentShift = (parentHeight - absoluteAncestorBorders.borderTopWidth - absoluteAncestorBorders.borderBottomWidth) / 2;
    node.y = -dy + absoluteAncestorBorders.borderTopWidth + parentShift - height / 2;
    vertical = 'CENTER';
  } else if (attachBottom) { // old: bottom < top
    node.y = -dy + parentHeight - absoluteAncestorBorders.borderBottomWidth - bottom - height;
    vertical = 'MAX';
  } else { // old: top < bottom - also for the case when there is neither top nor bottom defined.
    node.y = -dy + absoluteAncestorBorders.borderTopWidth + top;
    vertical = 'MIN';
  }

  if (attachLeft && attachRight) { // old: left === right
    const parentShift = (parentWidth - absoluteAncestorBorders.borderLeftWidth - absoluteAncestorBorders.borderRightWidth) / 2;
    node.x = -dx + absoluteAncestorBorders.borderLeftWidth + parentShift - width / 2;
    horizontal = 'CENTER';
  } else if (attachRight) { // old: right < left
    node.x = -dx + parentWidth - absoluteAncestorBorders.borderRightWidth - right - width;
    horizontal = 'MAX';
  } else { // old: left < right - also for the case when there is neither top nor bottom defined.
    node.x = -dx + absoluteAncestorBorders.borderLeftWidth + left;
    horizontal = 'MIN';
  }

  node.constraints = {
    horizontal,
    vertical,
  };

}

export function sizeWithUnitToPx(size: NonNullable<Property.Width>) {
  if (size == null) return 0;
  return parseInt(size as string);
}

export function nodeStyles(sbNode: CNode, sbParentNode: CElementNode | null) {
  return isCTextNode(sbNode) ? sbParentNode!.styles : sbNode.styles;
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
