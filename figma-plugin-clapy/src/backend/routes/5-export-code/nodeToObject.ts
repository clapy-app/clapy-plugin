import filetype from 'magic-bytes.js';

import { flags } from '../../../common/app-config';
import { warnNode } from '../../../common/error-utils';
import {
  baseBlacklist,
  ExportImageEntry,
  ExportImagesFigma,
  SceneNodeNoMethod,
} from '../../../common/sb-serialize.model';
import {
  isChildrenMixin,
  isFillsArray,
  isGroup,
  isInstance,
  isLayout,
  isMinimalFillsMixin,
  isMinimalStrokesMixin,
  isPage,
  isRectangle,
  isShapeExceptRectangle,
  isText,
} from '../../common/node-type-utils';
import { utf8ArrayToStr } from './Utf8ArrayToStr';

// Extracted from Figma typings
type RangeProp = keyof Omit<StyledTextSegment, 'characters' | 'start' | 'end'>;

const rangeProps: RangeProp[] = [
  'fillStyleId',
  'fills',
  'fontName',
  'fontSize',
  'hyperlink',
  'indentation',
  'letterSpacing',
  'lineHeight',
  'listOptions',
  'textCase',
  'textDecoration',
  'textStyleId',
];
/* as Writeable<typeof rangeProps> */
const blacklist = new Set<string>(baseBlacklist);
const textBlacklist = new Set<string>([...baseBlacklist, ...rangeProps, 'characters']);

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export interface SerializeContext {
  images: ExportImagesFigma;
  isInInstance?: boolean;
}

interface Options {
  skipChildren: boolean;
  skipParent: boolean;
  skipInstance: boolean;
}

// Let's keep it a week or two to ensure we don't need it. Then remove the flag and dead code if we validate the rotation workaround is not required anymore.
const useCancelRotationWorkaround = false;

/**
 * Transform node to object with keys, that are hidden by default.
 * @example
 * ```ts
 * const node = figma.currentPage.findOne((el) => el.type === "TEXT");
 * console.log(Object.keys(node).length) // 1
 * console.log(Object.keys(nodeToObject(node)).length) // 42
 * console.log(Object.keys(nodeToObject(node, true)).length) // 39
 * ```
 *
 * @param node
 * @param options
 */
export async function nodeToObject<T extends SceneNode>(node: T, context: SerializeContext, options: Options) {
  try {
    if (!isPage(node) && !node.visible) {
      throw new Error('NODE_NOT_VISIBLE');
    }
    const { skipChildren = false, skipParent = true, skipInstance = true } = options;
    const nodeIsShape = isShapeExceptRectangle(node);
    let exportAsSvg = nodeIsShape;
    let obj: any;
    if (!context.isInInstance && isInstance(node)) {
      context = { ...context, isInInstance: true };
    }
    if (!exportAsSvg && containsShapesOnly(node)) {
      exportAsSvg = true;
    }
    const nodeIsLayout = isLayout(node);
    const isSvgWithRotation = exportAsSvg && nodeIsLayout && node.rotation;
    const cancelRotation = useCancelRotationWorkaround && isSvgWithRotation && !context.isInInstance;

    let currentRotation: number | undefined = undefined;
    if (cancelRotation) {
      // SVG exports include the rotation, but coordinates don't match.
      // The workaround is to cancel the rotation, the time to extract the various properties. And we still add the rotation in the exported object to be applied in the output.
      // A better approach would be to better understand the link between the rotation and the coordinates in the exported SVG to write the corresponding CSS (would be better in terms of performance? + work in instances)
      currentRotation = node.rotation;
      node.rotation = 0;
    }

    const props = Object.entries(Object.getOwnPropertyDescriptors((node as any).__proto__));
    obj = { id: node.id, type: node.type };
    const isTxt = isText(node);
    const bl = isTxt ? textBlacklist : blacklist;
    for (const [name, prop] of props) {
      if (prop.get && !bl.has(name)) {
        try {
          if (typeof obj[name] === 'symbol') {
            obj[name] = 'Mixed';
          } else {
            obj[name] = prop.get.call(node);
          }
        } catch (err) {
          obj[name] = undefined;
        }
      }
    }
    if (isTxt) {
      obj._textSegments = node.getStyledTextSegments(rangeProps);
    }

    // If image, export it and send to front

    if (exportAsSvg) {
      obj.type = 'VECTOR' as VectorNode['type'];
      if (nodeIsShape) {
        node.effects = [];
        node.effectStyleId = '';
      }
      if (isGroup(node)) {
        // Interesting properties like constraints are in the children nodes. Let's make a copy.
        obj.constraints = (node.children[0] as ConstraintMixin)?.constraints;
      }

      // Change all stroke positions to center to fix the bad SVG export bug
      fixStrokeAlign(node);

      // TextDecoder is undefined, I don't know why. We are supposed to be in a modern JS engine. So we use a JS replacement instead.
      // But ideally, we should do:
      // obj._svg = new TextDecoder().decode(await node.exportAsync({ format: 'SVG' }));

      obj._svg = utf8ArrayToStr(await node.exportAsync({ format: 'SVG', useAbsoluteBounds: true }));
    } else if (isMinimalFillsMixin(node) && isFillsArray(node.fills)) {
      for (const fill of node.fills) {
        if (fill.type === 'IMAGE') {
          if (!fill.imageHash) {
            warnNode(
              node,
              'Image fill has no hash, I should check and understand why. Ignoring image:',
              JSON.stringify(fill),
            );
          } else {
            const image = figma.getImageByHash(fill.imageHash);
            if (!image) {
              warnNode(node, 'BUG Image hash available in fill, but image not found in global figma.getImageByHash.');
            } else {
              // If I need the hidden URL later:
              // https://www.figma.com/file/${figma.fileKey}/image/${fill.imageHash}
              const uint8Array = await image.getBytesAsync();
              const imageObj: ExportImageEntry = {
                bytes: Array.from(uint8Array),
              };
              // E.g. [{ extension: "png", mime: "image/png", typename: "png" }]
              const fileType = filetype(uint8Array);
              if (!image || !fileType[0]) {
                warnNode(node, 'BUG Image file type is not recognized by the file-type library.');
              } else {
                Object.assign(imageObj, fileType[0]);
              }
              context.images[fill.imageHash] = imageObj;
            }
          }
        }
      }
    }

    if (cancelRotation) {
      node.rotation = currentRotation as number;
      obj.rotation = currentRotation as number;
    } else if (isSvgWithRotation) {
      const { rotation, width, height } = obj;
      const rotationRad = (rotation * Math.PI) / 180;
      // Adjust x/y depending on the rotation. Figma's x/y are the coordinates of the original top/left corner after rotation. In CSS, it's the top-left corner of the final square containing the SVG.
      // Sounds a bit complex. We could avoid that by rotating in CSS instead. But It will have other side effects, like the space used in the flow (different in Figma and CSS).
      if (rotation >= -180 && rotation <= -90) {
        obj.height = Math.abs(width * Math.sin(rotationRad)) + Math.abs(height * Math.cos(rotationRad));
        obj.width = Math.abs(width * Math.cos(rotationRad)) + Math.abs(height * Math.sin(rotationRad));
        obj.x -= obj.width;
        obj.y -= getOppositeSide(90 - (rotation + 180), height);
      } else if (rotation > -90 && rotation <= 0) {
        obj.x += getOppositeSide(rotation, height);
        obj.height = Math.abs(width * Math.sin(rotationRad)) + Math.abs(height * Math.cos(rotationRad));
        obj.width = Math.abs(width * Math.cos(rotationRad)) + Math.abs(height * Math.sin(rotationRad));
        // Do nothing for y
      } else if (rotation > 0 && rotation <= 90) {
        obj.width = Math.abs(width * Math.sin(rotationRad)) + Math.abs(height * Math.cos(rotationRad));
        obj.height = Math.abs(width * Math.cos(rotationRad)) + Math.abs(height * Math.sin(rotationRad));
        // Do nothing for x
        obj.y -= getOppositeSide(rotation, width);
      } else if (rotation > 90 && rotation <= 180) {
        obj.height = Math.abs(width * Math.sin(rotationRad)) + Math.abs(height * Math.cos(rotationRad));
        obj.width = Math.abs(width * Math.cos(rotationRad)) + Math.abs(height * Math.sin(rotationRad));
        obj.x -= getOppositeSide(rotation - 90, width);
        obj.y -= obj.height;
      }
      // Here, the rotation is already included in the exported SVG. We shouldn't keep the CSS rotation.
      obj.rotation = 0;
    }

    if (node.parent && !skipParent) {
      obj.parent = { id: node.parent.id, type: node.parent.type };
    }
    if (isChildrenMixin(node) && !exportAsSvg && !skipChildren) {
      obj.children = await Promise.all(
        node.children.filter(child => child.visible).map((child: SceneNode) => nodeToObject(child, context, options)),
      );
    }
    if (isInstance(node) && node.mainComponent && !skipInstance) {
      obj.mainComponent = nodeToObject(node.mainComponent, context, options);
    }
    return obj as SceneNodeNoMethod;
  } catch (error: any) {
    if (typeof error === 'string') {
      error = new Error(error);
    }
    const nodeName = error.nodeName ? `${node.name} > ${error.nodeName}` : node.name;
    Object.assign(error, { nodeName: nodeName });
    throw error;
  }
}

function treatAsImage(node: SceneNode) {
  if (isMinimalFillsMixin(node) && Array.isArray(node.fills)) {
    for (const fill of node.fills as ReadonlyArray<Paint>) {
      if (fill.type === 'IMAGE') {
        return true;
      }
    }
  }
  return false;
}

function containsShapesOnly(node: SceneNode) {
  if (!isChildrenMixin(node) || !node.children.length) return false;
  for (const child of node.children) {
    if (!isShapeExceptRectangle(child) && !isRectangleWithoutImage(child)) {
      return false;
    }
  }
  return true;
}

function isRectangleWithoutImage(node: SceneNode): node is RectangleNode {
  if (!isRectangle(node)) {
    return false;
  }
  if (!isFillsArray(node.fills)) {
    return true;
  }
  for (const fill of node.fills) {
    if (fill.type === 'IMAGE') {
      return false;
    }
  }
  return true;
}

function getOppositeSide(rotation: number, adjacent: number) {
  const rotationRad = (rotation * Math.PI) / 180;
  const tangent = Math.sin(rotationRad);
  return tangent * adjacent;
}

// Filtering on keys: https://stackoverflow.com/a/49397693/4053349
type OmitMethods<T> = {
  [P in keyof T as T[P] extends Function ? never : P]: T[P];
};

//
// Below code is a WIP to handle hover (and variants?)
//

// TODO whitelist the fields I want to use for the diff
const diffFields = [
  'fills',
  'strokes',
  'strokeWeight',
  'strokeAlign',
  'strokeJoin',
  'dashPattern',
  'strokeCap',
  'strokeMiterLimit',
  'topLeftRadius',
  'topRightRadius',
  'bottomRightRadius',
  'bottomLeftRadius',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'opacity',
  'effects',
  'width',
  'height',
  'layoutMode',
  'layoutGrow',
  'layoutAlign',
  'primaryAxisAlignItems',
  'counterAxisAlignItems',
  'primaryAxisSizingMode',
  'counterAxisSizingMode',
  'clipsContent',
];
// relativeTransform
// rotation
// cornerSmoothing
// backgrounds
// itemSpacing
// overflowDirection

// diff: https://stackoverflow.com/questions/8572826/generic-deep-diff-between-two-objects
function addReactionDestination(obj: any) {
  for (const reaction of (obj.reactions || []) as Reaction[]) {
    if (reaction.trigger?.type === 'ON_HOVER' && reaction.action && reaction.action.type === 'NODE') {
      // TODO
      // Supposons qu'on a déjà le diff. Je peux écrire :
      // - Le résultat idéal attendu
      // - Ce qu'on en fait ensuite
      // Commencer éventuellement par une prop à la fois, pour faciliter la réflexion et l'implémentation.
    }
  }
}

// Source: https://forum.figma.com/t/svg-export-issue/3424/6
function fixStrokeAlign(node: SceneNode) {
  if (!flags.fixSvgStrokePositionBug) return;
  if (isMinimalStrokesMixin(node)) {
    node.strokeAlign = 'CENTER';
  }
  if (isChildrenMixin(node)) {
    for (const child of node.children) {
      fixStrokeAlign(child);
    }
  }
}
