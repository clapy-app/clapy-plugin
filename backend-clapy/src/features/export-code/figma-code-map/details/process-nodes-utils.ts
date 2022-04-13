import { VectorNode2 } from '../../create-ts-compiler/canvas-utils';

export function readSvg(node: VectorNode2) {
  // Remove width and height from SVG. Let the CSS define it.
  return node._svg?.replace(/^<svg width="\d+" height="\d+"/, '<svg');
}
