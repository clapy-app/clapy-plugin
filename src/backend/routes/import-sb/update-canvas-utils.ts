import { CElementNode, CPseudoElementNode, isCElementNode, MyStyles, Properties } from './sb-serialize.model';

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
    // return null;
    console.warn('Incorrect RGB value from CSS:', rgb);
    return { r: 1, g: 1, b: 1, a: 1 };
  }
  return rgbaRawMatchToFigma(match[1], match[2], match[3], match[5]);
}

export interface BorderMapping {
  color: Properties['borderColor'];
  style: Properties['borderStyle'];
  width: Properties['borderWidth'];
  x: 1 | 0 | -1;
  y: 1 | 0 | -1;
}

export function areBordersTheSame(borderMapping: BorderMapping[]) {
  let latestColor: Properties['borderColor'];
  let latestStyle: Properties['borderStyle'];
  let latestWidth: Properties['borderWidth'];
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

export function applyBorders(node: FrameNode, { borderBottomColor, borderBottomStyle, borderBottomWidth, borderLeftColor, borderLeftStyle, borderLeftWidth, borderRightColor, borderRightStyle, borderRightWidth, borderTopColor, borderTopStyle, borderTopWidth }: MyStyles, effects: Effect[]) {
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
    const borderWidthNum = sizeWithUnitToPx(borderTopWidth as string);
    if (borderTopStyle !== 'none' && borderWidthNum !== 0) {
      node.strokeAlign = 'INSIDE';
      node.strokeWeight = borderWidthNum;
      const { r, g, b, a } = cssRGBAToFigmaValue(borderTopColor as string);
      node.strokes = [{
        type: 'SOLID',
        color: { r, g, b },
        opacity: a,
      }];
    }
  } else {
    for (const { color, style, width, x, y } of borderMapping) {
      const borderWidthNum = sizeWithUnitToPx(width as string);
      if (style !== 'none' && borderWidthNum !== 0) {
        const { r, g, b, a } = cssRGBAToFigmaValue(color as string);
        effects.push({
          type: 'INNER_SHADOW',
          spread: 0,
          radius: 0,
          color: { r, g, b, a },
          offset: {
            x: x * borderWidthNum,
            y: y * borderWidthNum,
          },
          visible: true,
          blendMode: 'NORMAL',
        });
      }
    }
  }
}

const shadowRegex = `${rgbaRegex}\\s+${sizeRegex}\\s+${sizeRegex}\\s+${sizeRegex}\\s+${sizeRegex}(\\s+(inset))?`;

export function applyShadow(boxShadow: string, effects: Effect[]) {
  if (boxShadow === 'none') {
    return;
  }
  const matchShadow = new RegExp(shadowRegex);
  const match = matchShadow.exec(boxShadow);
  if (match == null) {
    // return null;
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

export function applyAutoLayout(node: FrameNode, figmaParentNode: FrameNode, sbNode: CElementNode | CPseudoElementNode) {
  const { paddingBottom, paddingLeft, paddingTop, paddingRight, display, flexDirection } = sbNode.styles;
  if (isCElementNode(sbNode)) {
    node.layoutMode = display === 'flex' && flexDirection === 'row'
      ? 'HORIZONTAL' : 'VERTICAL';
  } else {
    // Already done upfront:
    // node.resize(w, h);
  }

  applyFlexWidthHeight(node, figmaParentNode, sbNode);

  if (paddingBottom) node.paddingBottom = sizeWithUnitToPx(paddingBottom);
  if (paddingLeft) node.paddingLeft = sizeWithUnitToPx(paddingLeft);
  if (paddingTop) node.paddingTop = sizeWithUnitToPx(paddingTop);
  if (paddingRight) node.paddingRight = sizeWithUnitToPx(paddingRight);
}

function applyFlexWidthHeight(node: FrameNode, figmaParentNode: FrameNode, sbNode: CElementNode | CPseudoElementNode) {

  // OK, works most of the time
  // if (node.layoutMode === 'HORIZONTAL') {
  //   node.layoutGrow = 0;
  //   node.counterAxisSizingMode = 'AUTO';
  //   node.layoutAlign = 'STRETCH';
  //   node.primaryAxisSizingMode = 'FIXED';
  // } else {
  //   node.layoutAlign = 'STRETCH';
  //   node.primaryAxisSizingMode = 'AUTO';
  //   node.layoutGrow = 0;
  //   node.counterAxisSizingMode = 'FIXED';
  // }

  // const widthFillContainer = isWidth100P;
  // const heightFillContainer = isHeight100P;
  const widthFillContainer = true;
  const heightFillContainer = false; // Hug contents
  const parentHorizontal = figmaParentNode.layoutMode === 'HORIZONTAL';
  const parentVertical = !parentHorizontal;
  const nodeHorizontal = node.layoutMode === 'HORIZONTAL';
  const nodeVertical = !nodeHorizontal;

  // layoutGrow = 1 si (0 sinon) :
  // - Parent vertical && Height fill container
  // - ou Parent horizontal && width fill container
  node.layoutGrow = isCElementNode(sbNode)
    && ((parentVertical && heightFillContainer)
      || (parentHorizontal && widthFillContainer))
    ? 1 : 0;

  // layoutAlign = STRETCH (INHERIT sinon) :
  // - Parent vertical && width fill container
  // - ou Parent horizontal && height fill container
  node.layoutAlign = (parentVertical && widthFillContainer)
    || (parentHorizontal && heightFillContainer)
    ? 'STRETCH' : 'INHERIT';

  // primaryAxisSizingMode = FIXED (AUTO sinon) :
  // - Enfant vertical && height fill container
  // - ou Enfant horizontal && width fill container
  // - ou pas d'enfants
  node.primaryAxisSizingMode = (nodeVertical && heightFillContainer)
    || (nodeHorizontal && widthFillContainer)
    || (isCElementNode(sbNode) && !sbNode.children?.length)
    ? 'FIXED' : 'AUTO';

  // counterAxisSizingMode = FIXED (AUTO sinon) :
  // - Enfant vertical && width fill container
  // - ou Enfant horizontal && height fill container
  node.counterAxisSizingMode = (nodeVertical && widthFillContainer)
    || (nodeHorizontal && heightFillContainer)
    ? 'FIXED' : 'AUTO';
}

export function getSvgNodeFromBackground(backgroundImage: Properties['backgroundImage']) {
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
  return figma.createNodeFromSvg(decodeURIComponent(match[1]));
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

  node.relativeTransform = transformationMatrix;
}

export function applyRadius(node: FrameNode, { borderTopLeftRadius, borderTopRightRadius, borderBottomLeftRadius, borderBottomRightRadius }: MyStyles) {
  node.topLeftRadius = sizeWithUnitToPx(borderTopLeftRadius as string);
  node.topRightRadius = sizeWithUnitToPx(borderTopRightRadius as string);
  node.bottomLeftRadius = sizeWithUnitToPx(borderBottomLeftRadius as string);
  node.bottomRightRadius = sizeWithUnitToPx(borderBottomRightRadius as string);
}

export function applyAbsolutePosition(node: FrameNode, figmaParentNode: FrameNode, sbNode: CElementNode | CPseudoElementNode): FrameNode {
  const { bottom, left, top, right } = sbNode.styles;
  // TODO calculate the x/y based on the bottom, left... above and the position/size of the first parent which is absolutely or relatively positioned.
  // TODO add a context for that.
  const wrapper = figma.createFrame();
  wrapper.resize(0, 0);
  wrapper.clipsContent = false;
  wrapper.appendChild(node);
  return wrapper;
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