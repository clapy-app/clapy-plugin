import { MyStyles, Properties } from './sb-serialize.model';


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
  var matchRGB = new RegExp(rgbaRegex);
  var match = matchRGB.exec(rgb);
  if (match == null) {
    // return null;
    console.warn('Incorrect RGB value from CSS:', rgb);
    return { r: 1, g: 1, b: 1, a: 1 };
  }
  return rgbaRawMatchToFigma(match[1], match[2], match[3], match[5]);
}

export function sizeWithUnitToPx(size: Exclude<Properties['width'], undefined>) {
  if (size == null) return 0;
  return parseInt(size as string);
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
  var matchShadow = new RegExp(shadowRegex);
  var match = matchShadow.exec(boxShadow);
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