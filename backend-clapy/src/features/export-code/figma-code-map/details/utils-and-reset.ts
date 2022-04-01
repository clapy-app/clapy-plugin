import { Dict2 } from '../../../../common/general-utils';
import { SceneNodeNoMethod } from '../../../sb-serialize-preview/sb-serialize.model';
import { TagName } from '../../code.model';
import { isStyledTextSegment } from '../../create-ts-compiler/canvas-utils';

export function warnNode(node: SceneNodeNoMethod | StyledTextSegment, ...msg: any[]) {
  if (isStyledTextSegment(node)) {
    console.warn(...msg, node.characters);
  } else {
    console.warn(...msg, node.name, node.type, node.id);
  }
}

type ResetProps = 'border' | 'padding' | 'background' | 'boxSizingContent';

export const tagResets: Dict2<TagName, Dict2<ResetProps, boolean>> = {
  button: {
    border: true,
    padding: true,
    background: true,
    boxSizingContent: true,
  },
  input: {
    border: true,
  },
};

export function isMixed(value: any): value is typeof figma.mixed {
  return typeof value === 'symbol' || value === 'Mixed';
}

export function figmaColorToCssHex({ r, g, b }: RGB, opacity: number | undefined): string {
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
  const hex = Math.round(value * 255).toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}
