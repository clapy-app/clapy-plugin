import { isLayout } from './canvas-utils';
import { BorderWidths, RenderContext } from './import-model';
import { CElementNode, CNode, CPseudoElementNode, isCElementNode, isCPseudoElementNode, MyStyles, Properties } from './sb-serialize.model';

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

export function applyBackgroundColor(node: FrameNode, backgroundColor: Properties['backgroundColor']) {
  const { r, g, b, a } = cssRGBAToFigmaValue(backgroundColor as string);
  node.fills = a > 0 ? [{
    type: 'SOLID',
    color: { r, g, b },
    opacity: a,
  }] : [];
}

export function prepareBorderWidths({ borderBottomWidth, borderLeftWidth, borderTopWidth, borderRightWidth }: MyStyles) {
  return {
    borderBottomWidth: sizeWithUnitToPx(borderBottomWidth as string),
    borderLeftWidth: sizeWithUnitToPx(borderLeftWidth as string),
    borderTopWidth: sizeWithUnitToPx(borderTopWidth as string),
    borderRightWidth: sizeWithUnitToPx(borderRightWidth as string),
  } as BorderWidths;
}

export function applyBordersToEffects(node: FrameNode, { borderBottomColor, borderBottomStyle, borderLeftColor, borderLeftStyle, borderTopColor, borderTopStyle, borderRightColor, borderRightStyle }: MyStyles, { borderBottomWidth, borderLeftWidth, borderTopWidth, borderRightWidth }: BorderWidths, effects: Effect[]) {
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
  if (areBordersTheSame(borderMapping)) {
    const borderWidth = borderTopWidth;
    if (borderTopStyle !== 'none' && borderWidth !== 0) {
      node.strokeAlign = 'INSIDE';
      node.strokeWeight = borderWidth;
      const { r, g, b, a } = cssRGBAToFigmaValue(borderTopColor as string);
      node.strokes = [{
        type: 'SOLID',
        color: { r, g, b },
        opacity: a,
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
          color: { r, g, b, a },
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

export function appendMargins({ figmaParentNode }: RenderContext, sbNode: CNode, margins: Margins | undefined, previousMargins: Margins | undefined) {
  if (isCPseudoElementNode(sbNode)) {
    // Hack because we can't recognize margin: auto with computed CSS.
    // Let's assume it's typically used with pseudo elements.
    // Later, to replace with a check of the source CSS rule.
    return;
  }
  const { display } = sbNode.styles;
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
    space.resize(width, height);
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
  const { display, flexDirection } = sbNode.styles;
  const { paddingBottom, paddingLeft, paddingTop, paddingRight } = paddings;
  const fixedSize = !!svgNode;
  node.layoutMode = display === 'flex' && flexDirection === 'row'
    ? 'HORIZONTAL' : 'VERTICAL';

  applyFlexWidthHeight(node, context, sbNode, fixedSize);

  if (paddingBottom) node.paddingBottom = paddingBottom;
  if (paddingLeft) node.paddingLeft = paddingLeft;
  if (paddingTop) node.paddingTop = paddingTop;
  if (paddingRight) node.paddingRight = paddingRight;

  if ((/* node.layoutMode === 'NONE' || */  (isCElementNode(sbNode) && !sbNode.children?.length) || fixedSize) && !isNaN(w) && !isNaN(h)) {
    node.resize(w, h);
  }
}

function applyFlexWidthHeight(node: FrameNode, context: RenderContext, sbNode: CElementNode | CPseudoElementNode, fixedSize: boolean) {
  const { figmaParentNode, sbParentNode } = context;

  // const widthFillContainer = isWidth100P;
  // const heightFillContainer = isHeight100P;
  // sbNode.parent
  const widthFillContainer = !(sbParentNode?.styles.display === 'block' && sbNode.styles.display === 'inline-block'); // true unless block parent and inline-block child
  const heightFillContainer = false; // Hug contents
  const parentHorizontal = figmaParentNode.layoutMode === 'HORIZONTAL';
  const parentVertical = !parentHorizontal;
  const nodeHorizontal = node.layoutMode === 'HORIZONTAL';
  const nodeVertical = !nodeHorizontal;

  // layoutGrow = 1 si (0 sinon) si pas fixe et :
  // - Parent vertical && Height fill container
  // - ou Parent horizontal && width fill container
  node.layoutGrow = !fixedSize
    && ((parentVertical && heightFillContainer)
      || (parentHorizontal && widthFillContainer))
    ? 1 : 0;

  // layoutAlign = STRETCH (INHERIT sinon) si pas fixe et :
  // - Parent vertical && width fill container
  // - ou Parent horizontal && height fill container
  node.layoutAlign = !fixedSize
    && ((parentVertical && widthFillContainer)
      || (parentHorizontal && heightFillContainer))
    ? 'STRETCH' : 'INHERIT';

  // primaryAxisSizingMode = FIXED (AUTO sinon) si pas fixe et :
  // - Enfant vertical && height fill container
  // - ou Enfant horizontal && width fill container
  // - ou pas d'enfants (e.g. <hr />)
  node.primaryAxisSizingMode = fixedSize
    || (nodeVertical && heightFillContainer)
    || (nodeHorizontal && widthFillContainer)
    || (isCElementNode(sbNode) && !sbNode.children?.length)
    ? 'FIXED' : 'AUTO';

  // counterAxisSizingMode = FIXED (AUTO sinon) si pas fixe et :
  // - Enfant vertical && width fill container
  // - ou Enfant horizontal && height fill container
  node.counterAxisSizingMode = fixedSize
    || (nodeVertical && widthFillContainer)
    || (nodeHorizontal && heightFillContainer)
    ? 'FIXED' : 'AUTO';
}

export function getSvgNodeFromBackground(backgroundImage: Properties['backgroundImage'], borders: BorderWidths, paddings: Paddings) {
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

  // Required for cases when the svg container has padding, because createNodeFromSvg renders the SVG in the container with the right position (don't try to resize the svg, you will distort it), but it ignores the padding and renders in the whole node area. So the padding should be applied on a parent node.
  const { borderBottomWidth, borderLeftWidth, borderTopWidth, borderRightWidth } = borders;
  const { paddingBottom, paddingLeft, paddingTop, paddingRight } = paddings;
  const shouldWrap = borderBottomWidth > 0 || borderLeftWidth > 0 || borderTopWidth > 0 || borderRightWidth > 0 || paddingBottom > 0 || paddingLeft > 0 || paddingTop > 0 || paddingRight > 0;
  let node = figma.createNodeFromSvg(decodeURIComponent(match[1]));
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
  // Center, because we mainly use autolayout (wrapper or not).
  node.primaryAxisAlignItems = 'CENTER';
  node.counterAxisAlignItems = 'CENTER';
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

export function appendAbsolutelyPositionedNode(node: FrameNode, sbNode: CElementNode | CPseudoElementNode, context: RenderContext) {
  const { figmaParentNode, absoluteAncestor, absoluteAncestorBorders } = context;
  let wrapper: FrameNode | undefined;
  if (figmaParentNode.layoutMode === 'NONE') {
    // No need to wrap if the parent is not auto-layout (e.g. an absolute position right within an absolutely positioned node)
    wrapper = node;
  } else {
    wrapper = figma.createFrame();
    wrapper.name = 'Absolute position wrapper';
    // 1x1 px (resize() rounds to 1 px, although it doesn't with the UI :( )
    wrapper.resize(0.01, 0.01);
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

  const { width, height } = node;
  const { width: parentWidth, height: parentHeight } = absoluteAncestor;
  const { bottom, left, top, right } = prepareAbsoluteConstraints(sbNode.styles);
  if (top < bottom) {
    node.y = -dy + absoluteAncestorBorders.borderTopWidth + top;
  } else if (bottom < top) {
    node.y = -dy + parentHeight - absoluteAncestorBorders.borderBottomWidth - bottom - height;
  } else if (top === bottom) {
    const parentShift = (parentHeight - absoluteAncestorBorders.borderTopWidth - absoluteAncestorBorders.borderBottomWidth) / 2;
    node.y = -dy + absoluteAncestorBorders.borderTopWidth + parentShift - height / 2;
  }

  if (left < right) {
    node.x = -dx + absoluteAncestorBorders.borderLeftWidth + left;
  } else if (right < left) {
    node.x = -dx + parentWidth - absoluteAncestorBorders.borderRightWidth - right - width;
  } else if (left === right) {
    const parentShift = (parentWidth - absoluteAncestorBorders.borderLeftWidth - absoluteAncestorBorders.borderRightWidth) / 2;
    node.x = -dx + absoluteAncestorBorders.borderLeftWidth + parentShift - width / 2;
  }

}

export function sizeWithUnitToPx(size: Exclude<Properties['width'], undefined>) {
  if (size == null) return 0;
  return parseInt(size as string);
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