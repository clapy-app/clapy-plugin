import { extractLinearGradientParamsFromTransform, extractRadialOrDiamondGradientParams } from '@figma-plugin/helpers';
import { DeclarationPlain } from 'css-tree';
import { PropertiesHyphen } from 'csstype';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { writeAsset } from '../create-ts-compiler/2-write-asset';
import { isGroup, isText, isVector, ValidNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';
import { figmaColorToCssHex, round, warnNode } from './details/utils-and-reset';
import { addOpacity } from './opacity';

export function backgroundFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  // Text color is handled separately (color.ts)
  if (isText(node) || isVector(node) || isGroup(node)) return;

  const visibleFills = (Array.isArray(node.fills) ? (node.fills as Paint[]) : []).filter(({ visible }) => visible);
  if (visibleFills.length) {
    const { width, height } = node;
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
          continue;
        }
        const imageEntry = images[fill.imageHash];

        if (!imageEntry.url) {
          warnNode(node, 'BUG node image fill without URL:', JSON.stringify(fill));
          continue;
        }

        const extension = imageEntry.extension || 'jpg';
        const content = imageEntry.url;
        const assetCssUrl = writeAsset(context, node, extension, content);

        // webpackIgnore is a workaround for webpack to ignore those public paths (to work with CRA CLI)
        // - codesandbox: put assets in public folder instead of source (csb bundling doesn't process CSS url() :( )
        // - CRA CLI with the above comment to leave the public URL instead of having webpack processing it.
        bgImages.push(`/* webpackIgnore: true */ url("${assetCssUrl}")`);

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
      } else if (fill.type === 'GRADIENT_LINEAR') {
        const {
          start: [startX, startY],
          end: [endX, endY],
        } = extractLinearGradientParamsFromTransform(width, height, fill.gradientTransform);
        const angle = round(angleFromPointsAsCss(startX, startY, endX, endY), 1);
        // This rule is an approximation. A Notion ticket is created to replace with an exact equivalent:
        // https://www.notion.so/Fill-linear-gradient-convert-Figma-rule-into-the-exact-equivalent-in-CSS-6a8f9c7fd59047658256b0b88b7d3c38
        bgImages.push(
          `linear-gradient(${angle}deg, ${fill.gradientStops
            .map(colorStop => `${figmaColorToCssHex(colorStop.color)} ${Math.round(colorStop.position * 100)}%`)
            .join(', ')})`,
        );
      } else if (fill.type === 'GRADIENT_RADIAL' || fill.type === 'GRADIENT_DIAMOND') {
        let {
          rotation,
          center: [centerX, centerY],
          radius: [radiusX, radiusY],
        } = extractRadialOrDiamondGradientParams(width, height, fill.gradientTransform);
        // Same as linear, to improve. But even worse: extractRadialOrDiamondGradientParams is buggy, the radius tends to be wrong depending on the rotation.
        // Rotation not supported either, but it can be trickier to support it.
        bgImages.push(
          `radial-gradient(ellipse ${radiusX}px ${radiusY}px at ${centerX}px ${centerY}px, ${fill.gradientStops
            .map(colorStop => `${figmaColorToCssHex(colorStop.color)} ${Math.round(colorStop.position * 100)}%`)
            .join(', ')})`,
        );
      } else if (fill.type === 'GRADIENT_ANGULAR') {
        let {
          rotation,
          center: [centerX, centerY],
          radius: [radiusX, radiusY],
        } = extractRadialOrDiamondGradientParams(width, height, fill.gradientTransform);
        // conic-gradient(from 66deg at 90px 101px, red, orange, yellow, green, blue)
        bgImages.push(
          `conic-gradient(from ${rotation + 90}deg at ${centerX}px ${centerY}px, ${fill.gradientStops
            .map(colorStop => `${figmaColorToCssHex(colorStop.color)} ${Math.round(colorStop.position * 100)}%`)
            .join(', ')})`,
        );
      } else {
        warnNode(node, 'TODO Unsupported background fill', JSON.stringify(fill));
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

function angleFromPointsAsCss(ax: number, ay: number, bx: number, by: number) {
  const dy = by - ay;
  const dx = bx - ax;
  let theta = Math.atan2(dy, dx); // range (-PI, PI]
  theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
  //if (theta < 0) theta = 360 + theta; // range [0, 360)
  return theta + 90;
}
