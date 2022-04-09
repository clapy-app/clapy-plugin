import { DeclarationPlain } from 'css-tree';
import { PropertiesHyphen } from 'csstype';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { isGroup, isText, isVector, ValidNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';
import { figmaColorToCssHex, warnNode } from './details/utils-and-reset';
import { addOpacity } from './opacity';

export function backgroundFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  // Text color is handled separately (color.ts)
  if (isText(node) || isVector(node) || isGroup(node)) return;

  const visibleFills = (Array.isArray(node.fills) ? (node.fills as Paint[]) : []).filter(({ visible }) => visible);
  if (visibleFills.length) {
    const { images } = context.componentContext.projectContext;
    const bgColors: string[] = [];
    const bgImages: string[] = [];
    const bgSizes: PropertiesHyphen['background-size'][] = [];
    // let rotation: number | undefined = undefined;
    for (const fill of visibleFills) {
      if (fill.type === 'SOLID') {
        // fill.blendMode
        const { color, opacity } = fill;
        const hex = figmaColorToCssHex(color, opacity);
        bgColors.push(hex);
      } else if (fill.type === 'IMAGE') {
        if (!fill.imageHash) {
          warnNode(node, 'Fill image has null imageHash! Not expected, to debug. Fill:', JSON.stringify(fill));
        } else {
          const imageUrl = images[fill.imageHash];
          bgImages.push(`url("${imageUrl}")`);

          let scaleMode = fill.scaleMode;
          if (!scaleModeToBgSize[scaleMode]) {
            warnNode(
              node,
              'TODO What, a fill type which is none of FIT, FILL, CROP, TILE? Not supported and to check. We fallback to FILL behavior.',
            );
            scaleMode = 'FILL';
          }
          bgSizes.push(scaleModeToBgSize[scaleMode]);

          // Apply the first opacity I find
          addOpacity(styles, fill.opacity);

          // Rotation in background is not supported yet. The below code does not work that well.
          // if (fill.rotation && !rotation) {
          //   rotation = fill.rotation;
          // }
        }
      } else if (fill.type === 'GRADIENT_LINEAR') {
        // fill.gradientStops
        bgImages.push(
          `linear-gradient(135deg, ${fill.gradientStops
            .map(colorStop => `${figmaColorToCssHex(colorStop.color)} ${Math.round(colorStop.position * 100)}%`)
            .join(', ')})`,
        );
      } else {
        warnNode(node, 'TODO Unsupported non solid background, fill', JSON.stringify(fill));
      }
    }
    if (bgColors.length) {
      addStyle(styles, 'background-color', bgColors.reverse().join(', '));
    }
    if (bgImages.length) {
      addStyle(styles, 'background-image', bgImages.reverse().join(', '));
      addStyle(styles, 'background-position', 'center');
      addStyle(styles, 'background-repeat', 'no-repeat');
    }
    if (bgSizes.length) {
      addStyle(styles, 'background-size', bgSizes.reverse().join(', '));
    }
    // Previous logic, disabled for now:
    // Apply the rotation only if there is one image
    // KO, it rotates the whole div, giving bad width/height.
    // if (bgImages.length === 1) {
    //   applyRotate(context, rotation, styles);
    // }
  }
}

const scaleModeToBgSize = {
  FIT: 'contain',
  FILL: 'cover',
  // To support TILE, we need to calculate the image size based on intrinsic sizes and fill.scalingFactor (percentage). To get the intrinsic size of the images:
  // https://stackoverflow.com/questions/15696527/node-get-image-properties-height-width
  // For CROP, no idea how to get the image position in the crop. It doesn't seem to be available in the fill object.
  // In the meanwhile, in both cases, we fallback to FILL behavior.
  CROP: 'cover',
  TILE: 'cover',
};
