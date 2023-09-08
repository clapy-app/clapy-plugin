import type { MinimalStrokesMixin2 } from '../create-ts-compiler/canvas-utils.js';
import { isIndividualStrokesMixin } from '../create-ts-compiler/canvas-utils.js';
import { isMixed } from './utils-and-reset.js';

export function strokeWeightX(node: MinimalStrokesMixin2) {
  const w = node.strokeWeight;
  const n2 = node as unknown as IndividualStrokesMixin;
  if (!isIndividualStrokesMixin(n2)) {
    return 0;
  }
  return isMixed(w) ? (n2.strokeLeftWeight || 0) + (n2.strokeRightWeight || 0) : w;
}

export function strokeWeightY(node: MinimalStrokesMixin2) {
  const w = node.strokeWeight;
  const n2 = node as unknown as IndividualStrokesMixin;
  if (!isIndividualStrokesMixin(n2)) {
    return 0;
  }
  return isMixed(w) ? (n2.strokeTopWeight || 0) + (n2.strokeBottomWeight || 0) : w;
}
