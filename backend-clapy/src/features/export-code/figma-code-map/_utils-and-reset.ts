import { Dict2 } from '../../../common/general-utils';
import { SceneNodeNoMethod } from '../../sb-serialize-preview/sb-serialize.model';
import { TagName } from '../code.model';

export function warnNode(node: SceneNodeNoMethod, ...msg: any[]) {
  console.warn(...msg, node.name, node.type, node.id);
}

type ResetProps = 'border' | 'padding';

export const tagResets: Dict2<TagName, Dict2<ResetProps, boolean>> = {
  button: {
    border: true,
    padding: true,
  },
  input: {
    border: true,
  },
};

export function figmaColorToCssRGBA({ r, g, b }: RGB, opacity: number | undefined): string {
  return opacity === undefined || opacity === 1
    ? shortenHex(`#${zeroOneToHex(r)}${zeroOneToHex(g)}${zeroOneToHex(b)}`)
    : shortenHex(`#${zeroOneToHex(r)}${zeroOneToHex(g)}${zeroOneToHex(b)}${zeroOneToHex(opacity)}`);
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
    return '#' + hex.charAt(1) + hex.charAt(3) + hex.charAt(5) + (hex.length === 7 ? '' : hex.charAt(7));
  }
  return hex;
}

function zeroOneToHex(value: number) {
  return Math.round(value * 255).toString(16);
}
