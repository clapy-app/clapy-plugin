import type { DeclarationPlain } from 'css-tree';
import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from '../code.model.js';
import type { ValidNode } from '../create-ts-compiler/canvas-utils.js';
import { isLine } from '../create-ts-compiler/canvas-utils.js';
import type { StyleValue } from '../css-gen/css-factories-high.js';
import { addStyle } from '../css-gen/css-factories-high.js';
import { strokeWeightY } from '../gen-node-utils/mixed-props-utils.js';
import { round } from '../gen-node-utils/utils-and-reset.js';

export function lineFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  // Lines are a special case for borders and other styles. They are treated separately.
  if (!isLine(node) || !generateLineSeparately(node)) {
    return styles;
  }

  const [w, h] = rotate(node.width, node.height + strokeWeightY(node), node.rotation);
  const rotationRounded = round(node.rotation);

  const nodeWidth = styles.width;
  const nodeHeight = styles.height;

  addStyle(context, node, styles, 'width', [w, 'px']);
  addStyle(context, node, styles, 'height', [h, 'px']);
  addStyle(context, node, styles, 'position', 'relative');

  if (!node.beforeStyles) node.beforeStyles = {};
  addStyle(context, node, node.beforeStyles, 'content', "''");
  addStyle(context, node, node.beforeStyles, 'position', 'absolute');
  addStyle(context, node, node.beforeStyles, 'top', 0);
  addStyle(context, node, node.beforeStyles, 'left', 0);
  addStyle(context, node, node.beforeStyles, 'transform-origin', '0 0');
  const transforms: StyleValue<'transform'>[] = [];
  let translateX: number | undefined = undefined;
  let translateY: number | undefined = undefined;
  if (Math.abs(node.rotation) > 90) {
    translateX = w;
  }
  if (node.rotation > 0) {
    translateY = h;
  }
  if (translateX && !translateY) {
    transforms.push(`translateX(${w}px)`);
  } else if (translateY && !translateX) {
    transforms.push(`translateY(${h}px)`);
  } else if (translateX && translateY) {
    transforms.push(`translate(${w}px, ${h}px)`);
  }
  transforms.push(`rotate(${-rotationRounded}deg)`);
  addStyle(context, node, node.beforeStyles, 'transform', ...transforms);
  if (nodeWidth) {
    node.beforeStyles.width = nodeWidth;
  }
  if (nodeHeight) {
    node.beforeStyles.height = nodeHeight;
  }

  // TODO cadrillage : l'instance surcharge la largeur, KO.

  return node.beforeStyles;
}

export function generateLineSeparately(node: ValidNode) {
  return !!node.rotation;
}

function rotate(width: number, height: number, degrees: number) {
  // Convert the angle to radians
  const radians = (degrees * Math.PI) / 180;

  // Calculate the new dimensions
  const newWidth = round(Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians)));
  const newHeight = round(Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians)));

  return [newWidth, newHeight];
}
