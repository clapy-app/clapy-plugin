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

function zeroOneToHex(value: number) {
  const hex = Math.round(value * 255).toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}
