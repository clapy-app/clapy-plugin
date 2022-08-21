import type {
  PageNode2,
  PageNodeNoMethod,
  SceneNode2,
  SceneNodeNoMethod,
} from '../../sb-serialize-preview/sb-serialize.model.js';
import { isStyledTextSegment } from '../create-ts-compiler/canvas-utils.js';

export function warnNode(
  node: SceneNodeNoMethod | SceneNode2 | StyledTextSegment | PageNodeNoMethod | PageNode2,
  ...msg: any[]
) {
  if (isStyledTextSegment(node)) {
    console.warn(...msg, node.characters);
  } else {
    console.warn(...msg, node.name, node.type, node.id);
  }
}

export function isMixed(value: any): value is typeof figma.mixed {
  return typeof value === 'symbol' || value === 'Mixed';
}

export function figmaColorToCssHex(color: RGB | RGBA, opacity?: number | undefined): string {
  const { r, g, b, a } = color as RGBA;
  const op = a ?? opacity ?? 1;
  return op === undefined || opacity === 1
    ? shortenHex(`#${zeroOneToHex(r)}${zeroOneToHex(g)}${zeroOneToHex(b)}`)
    : shortenHex(`#${zeroOneToHex(r)}${zeroOneToHex(g)}${zeroOneToHex(b)}${zeroOneToHex(op)}`);
}

function shortenHex(hex: string) {
  if (hex.length !== 7 && hex.length !== 9) {
    return hex;
  }
  if (
    hex.charAt(1) === hex.charAt(2) &&
    hex.charAt(3) === hex.charAt(4) &&
    hex.charAt(5) === hex.charAt(6) &&
    (hex.length === 7 || hex.charAt(7) === hex.charAt(8))
  ) {
    return `#${hex.charAt(1)}${hex.charAt(3)}${hex.charAt(5)}${hex.length === 7 ? '' : hex.charAt(7)}`;
  }
  return hex;
}

export function hexToCSSRgb(hex: string) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (_, r, g, b) => {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    console.warn('Invalid color hexadecimal value:', hex, '- defaulting to white');
    return { r: 1, g: 1, b: 1 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function zeroOneToHex(value: number) {
  const hex = Math.round(value * 255).toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}

export function round(num: number, precision = 4) {
  // Math.round for rounding, but let's try trunc() so that elements are rounded to the bigger size.
  let res = Math.round(num * 10 ** precision) / 10 ** precision;
  // To avoid -0 (not nice for display)
  return res === 0 ? 0 : res;
}

export function parseTransformationMatrix(transformationMatrix: Transform) {
  const [[a, c, tx], [b, d, ty]] = transformationMatrix;
  const sx = round(Math.sign(a) * Math.sqrt(a * a + b * b));
  const sy = round(Math.sign(d) * Math.sqrt(c * c + d * d));
  const rotation = round(radiansToDegrees(Math.atan2(-b, a)));
  // const rotation2 = round(radiansToDegrees(Math.atan2(c, d)));
  // => Same for traditional transformation matrix.
  // Gives a different result for gradientTransform => not the same type of transformation matrix?
  return {
    tx,
    ty,
    sx,
    sy,
    rotation, // in degrees
  };
}

function radiansToDegrees(radians: number) {
  return radians * (180 / Math.PI);
}

export function angleFromPointsAsCss(ax: number, ay: number, bx: number, by: number) {
  const dy = by - ay;
  const dx = bx - ax;
  let theta = Math.atan2(dy, dx); // range (-PI, PI]
  theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
  //if (theta < 0) theta = 360 + theta; // range [0, 360)
  return theta + 90;
}
