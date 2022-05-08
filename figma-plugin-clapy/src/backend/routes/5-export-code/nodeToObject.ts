import filetype from 'magic-bytes.js';

import { removeNode } from '../2-update-canvas/update-canvas-utils';
import { flags } from '../../../common/app-config';
import { handleError, warnNode } from '../../../common/error-utils';
import { isArrayOf, parseTransformationMatrix } from '../../../common/general-utils';
import {
  ComponentNodeNoMethod,
  Dict,
  ExportImageEntry,
  ExportImagesFigma,
  extractionBlacklist,
  SceneNodeNoMethod,
} from '../../../common/sb-serialize.model';
import { env } from '../../../environment/env';
import {
  isBaseFrameMixin,
  isBlendMixin,
  isChildrenMixin,
  isComponentSet,
  isGroup,
  isInstance,
  isLayout,
  isMinimalFillsMixin,
  isMinimalStrokesMixin,
  isPage,
  isRectangle,
  isShapeExceptDivable,
  isText,
  LayoutNode,
  ShapeNode,
} from '../../common/node-type-utils';
import { utf8ArrayToStr } from './Utf8ArrayToStr';

// Extracted from Figma typings
type StyledTextSegment2 = Omit<StyledTextSegment, 'characters' | 'start' | 'end'>;
type RangeProp = keyof StyledTextSegment2;

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
const blacklist = new Set<string>(extractionBlacklist);
const textBlacklist = new Set<string>([...extractionBlacklist, ...rangeProps, 'characters']);

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export interface SerializeContext {
  images: ExportImagesFigma;
  components: Dict<ComponentNodeNoMethod>;
  isInInstance?: boolean;
  // Extract styles to process them later
  textStyles: Dict<TextStyle>;
  fillStyles: Dict<PaintStyle>;
  strokeStyles: Dict<PaintStyle>;
  effectStyles: Dict<EffectStyle>;
  gridStyles: Dict<GridStyle>;
  // VectorRegion fillStyleId
}

interface Options {
  skipChildren: boolean;
  skipInstance: boolean;
  skipParent: boolean;
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
export async function nodeToObject<T extends SceneNode>(
  node: T,
  context: SerializeContext,
  options: Partial<Options> = {},
) {
  const { skipChildren = false, skipInstance = true, skipParent = true } = options;
  return nodeToObjectRec(node, context, { skipChildren, skipParent, skipInstance });
}
async function nodeToObjectRec<T extends SceneNode>(node: T, context: SerializeContext, options: Options) {
  try {
    if (!isPage(node) && !node.visible) {
      throw new Error('NODE_NOT_VISIBLE');
    }
    const { skipChildren, skipInstance, skipParent } = options;
    const nodeIsShape = isShapeExceptDivable(node);
    let exportAsSvg = nodeIsShape;
    let obj: any;
    if (!context.isInInstance && isInstance(node)) {
      context = { ...context, isInInstance: true };
    }
    const { isInInstance, textStyles, fillStyles, strokeStyles, effectStyles, gridStyles } = context;
    if (!exportAsSvg && shouldGroupAsSVG(node)) {
      exportAsSvg = true;
    }
    const nodeIsLayout = isLayout(node);
    const isSvgWithRotation = exportAsSvg && nodeIsLayout && node.rotation;
    const cancelRotation = useCancelRotationWorkaround && isSvgWithRotation && !isInInstance;

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
          const val = prop.get.call(node);
          if (typeof val === 'symbol') {
            obj[name] = 'Mixed';
          } else {
            obj[name] = val;
          }
        } catch (err) {
          console.warn('Failed to read node value', name, 'from node', node.name, node.type, node.id);
          obj[name] = undefined;
        }
      }
    }
    if (isTxt) {
      const segments = node.getStyledTextSegments(rangeProps);
      obj._textSegments = segments;
      for (const { textStyleId, fillStyleId } of segments) {
        addStyle(textStyles, textStyleId);
        addStyle(fillStyles, fillStyleId);
      }
    }

    const isBlend = isBlendMixin(node);
    if (isBlend && node.isMask) {
      exportAsSvg = true;
      addStyle(effectStyles, node.effectStyleId);
    }

    if (isMinimalStrokesMixin(node)) {
      addStyle(strokeStyles, node.strokeStyleId);
    }

    if (isBaseFrameMixin(node)) {
      addStyle(gridStyles, node.gridStyleId);
    }

    if (exportAsSvg) {
      let nodeToExport = node as LayoutNode;
      let copyForExport: LayoutNode | undefined = undefined;
      try {
        if (isBlend) {
          // Masks cannot be directly exported as SVG. So we make a copy and disable the mask on it to export as SVG.
          // In the finally clause, this copy is removed. Source nodes must be treated as readonly since they can be
          // inside instances of components.
          if ((nodeToExport as BlendMixin).isMask) {
            [nodeToExport, copyForExport] = ensureCloned(nodeToExport, copyForExport);
            (nodeToExport as BlendMixin).isMask = false;
            if (isMinimalFillsMixin(nodeToExport) && isArrayOf<Paint>(nodeToExport.fills)) {
              // Only keep a black fill (in case there was an image or anything heavy and irrelevant).
              // Well, images with transparency would be useful. Later.
              nodeToExport.fills = [
                {
                  type: 'SOLID',
                  color: { r: 0, g: 0, b: 0 },
                },
              ];
            }
          }
        }

        obj.type = 'VECTOR' as VectorNode['type'];
        if (isShapeExceptDivable(nodeToExport)) {
          [nodeToExport, copyForExport] = ensureCloned(nodeToExport, copyForExport);
          (nodeToExport as ShapeNode).effects = [];
          (nodeToExport as ShapeNode).effectStyleId = '';
        }
        const { rotation } = parseTransformationMatrix(node.absoluteTransform);
        // console.log('absolute rotation:', rotation);
        if (rotation !== 0) {
          [nodeToExport, copyForExport] = ensureCloned(nodeToExport, copyForExport);
          // nodeToExport.rotation -= rotation;
        }
        if (isGroup(nodeToExport)) {
          // Interesting properties like constraints are in the children nodes. Let's make a copy.
          obj.constraints = (nodeToExport.children[0] as ConstraintMixin)?.constraints;
        }

        // Change all stroke positions to center to fix the bad SVG export bug
        fixStrokeAlign(nodeToExport);

        // TextDecoder is undefined, I don't know why. We are supposed to be in a modern JS engine. So we use a JS replacement instead.
        // But ideally, we should do:
        // obj._svg = new TextDecoder().decode(await nodeToExport.exportAsync({ format: 'SVG' }));

        try {
          obj._svg = utf8ArrayToStr(
            await nodeToExport.exportAsync({ format: 'SVG', useAbsoluteBounds: false /* true */ }),
          );
        } catch (error) {
          warnNode(node, 'Failed to export node as SVG, ignoring.');
          console.error(error);
        }
      } finally {
        removeNode(copyForExport);
      }
    } else if (!isTxt && isMinimalFillsMixin(node) && isArrayOf<Paint>(node.fills)) {
      // Fills can be mixed if node is Text. Ignore it, text segments are already processed earlier.
      addStyle(fillStyles, node.fillStyleId);

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
      // Update: resetting here should not be required anymore. We skip it in the API. To test, confirm, and delete this code in a few weeks.
      // obj.rotation = 0;
    }

    if (node.parent && !skipParent) {
      obj.parent = { id: node.parent.id, type: node.parent.type };
    }
    if (isChildrenMixin(node) && !exportAsSvg && !skipChildren) {
      obj.children = (
        await Promise.all(
          node.children
            .filter(child => child.visible)
            .map((child: SceneNode) => nodeToObjectRec(child, context, options)),
        )
      ).filter(child => !!child);
    }
    if (isInstance(node) && node.mainComponent && !skipInstance) {
      const { id, name, type } = node.mainComponent;
      // For MUI, only the parent name is useful.
      // For normal components, only the compoent ID is useful.
      // But we keep id, name, type for both in case we want to do sanity checks.
      obj.mainComponent = { id, name, type };
      if (isComponentSet(node.mainComponent.parent)) {
        const { id, name, type } = node.mainComponent.parent;
        obj.mainComponent.parent = { id, name, type };
      }
      if (!context.components[id]) {
        const comp = (await nodeToObjectRec(node.mainComponent, context, options)) as ComponentNodeNoMethod | undefined;
        if (comp) {
          context.components[id] = comp;
        }
      }
    }
    // If we need to debug symbols:
    // for (const [key, val] of Object.entries(obj)) {
    //   if (typeof val === 'symbol') {
    //     throw new Error(`Symbol found, key ${key}, val ${String(val)}`);
    //   }
    // }
    return obj as SceneNodeNoMethod;
  } catch (error: any) {
    if (typeof error === 'string') {
      error = new Error(error);
    }
    const nodeName = error.nodeName ? `${node.name} > ${error.nodeName}` : node.name;
    Object.assign(error, { nodeName: nodeName });
    if (!env.isProd) {
      throw error;
    }
    // Production: don't block the process
    handleError(error);
    return;
  }
}

function shouldGroupAsSVG(node: SceneNode) {
  if (!isChildrenMixin(node) || !node.children.length) return false;
  // If only one child, don't group as SVG
  // TODO reactivate after having fixed the divider bug on Clément's wireframe
  // if (!(node.children.length > 1)) return false;
  // If one of the children is not a shape, don't group as SVG
  for (const child of node.children) {
    if (!isShapeExceptDivable(child) && !isRectangleWithoutImage(child)) {
      return false;
    }
  }
  // Otherwise, group as SVG
  return true;
}

function isRectangleWithoutImage(node: SceneNode): node is RectangleNode {
  if (!isRectangle(node)) {
    return false;
  }
  if (!isArrayOf<Paint>(node.fills)) {
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

function ensureCloned<T extends LayoutNode>(node: T, clone: T | undefined): [T, T] {
  if (!clone) {
    clone = node.clone() as T;
    node = clone;
  }
  return [node, clone];
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

function addStyle<TStyle extends BaseStyle>(styles: Dict<TStyle>, styleId: string | typeof figma.mixed) {
  if (typeof styleId === 'string') {
    const styleFull = figma.getStyleById(styleId);
    if (styleFull && !styles[styleId]) {
      const style: Dict<any> = {};
      const props = Object.entries(Object.getOwnPropertyDescriptors((styleFull as any).__proto__));
      for (const [name, prop] of props) {
        // Remove ID to make the JSON smaller because it's already available as key in the style dictionary.
        if (name === 'id') continue;

        const val = prop.get?.call(styleFull);
        try {
          if (val) {
            if (typeof val === 'symbol') {
              style[name] = 'Mixed';
            } else {
              style[name] = val;
            }
          }
        } catch (err) {
          console.warn('Failed to assign value', name);
          // style2[name] = undefined;
        }
      }

      styles[styleId] = style as TStyle;
    }
  }
}
