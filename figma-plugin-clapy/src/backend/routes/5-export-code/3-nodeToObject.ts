import equal from 'fast-deep-equal';
import filetype from 'magic-bytes.js';

import { removeNode } from '../2-update-canvas/update-canvas-utils';
import { flags } from '../../../common/app-config';
import type { Nil } from '../../../common/app-models.js';
import { handleError, warnNode } from '../../../common/error-utils';
import { isArrayOf, parseTransformationMatrix } from '../../../common/general-utils';
import type {
  ComponentNodeNoMethod,
  Dict,
  ExportImageEntry,
  ExportImagesFigma,
  NodeKeys,
  SceneNodeNoMethod,
} from '../../../common/sb-serialize.model';
import { nodeDefaults } from '../../../common/sb-serialize.model';
import { env } from '../../../environment/env';
import type { LayoutNode, ShapeNode } from '../../common/node-type-utils';
import {
  isBaseFrameMixin,
  isBlendMixin,
  isChildrenMixin,
  isComponent,
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
} from '../../common/node-type-utils';
import { perfMeasure } from '../../common/perf-utils';
import { exportNodeTokens } from './9-extract-tokens';
import { areSvgEqual, nodeAttributes, rangeProps } from './node-attributes';
import { utf8ArrayToStr } from './Utf8ArrayToStr';

const propsNeverOmitted = new Set<keyof SceneNodeNoMethod>(['type']);
const componentPropsNotInherited = new Set<keyof SceneNodeNoMethod>(['type', 'visible', 'name']);

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

type IntermediateNodes = (SceneNode | PageNode)[];

export interface SerializeContext {
  images: ExportImagesFigma;
  components: Dict<ComponentNodeNoMethod>;
  isInInstance?: boolean;
  // When into an instance, we keep track of the corresponding node in the component to find style overrides.
  // The only usage is to avoid writing a value in the extrated JSON. We could replace it with a more relevant
  // node: nextIntermediateNode. But it will require to update the webservice as well. And to avoid issues during
  // the deployment, support both nodeOfComp and nextIntermediateNode as base node in the API.
  nodeOfComp?: SceneNode;
  intermediateNodes: IntermediateNodes;
  isComp?: boolean;
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
export async function nodeToObject<T extends SceneNode | PageNode>(
  node: T,
  context: SerializeContext,
  options: Partial<Options> = {},
) {
  const { skipChildren = false, skipInstance = true, skipParent = true } = options;
  if (flags.verbose && !isComponent(node)) {
    console.log('Extracting selection', node.name);
  }
  context = { ...context, intermediateNodes: [node] };
  return nodeToObjectRec(node, context, { skipChildren, skipParent, skipInstance });
}

let prevNode: SceneNode | PageNode | undefined = undefined;

async function nodeToObjectRec<T extends SceneNode | PageNode>(node: T, context: SerializeContext, options: Options) {
  try {
    if (flags.verbose) {
      if (isComponent(node)) {
        console.log(
          'Extracting component',
          isComponentSet(node.parent) ? `${node.parent.name} (variant ${node.name})` : node.name,
        );
      } else {
        console.log('Extracting node', node.name);
      }
    }
    let { skipChildren, skipInstance, skipParent } = options;
    const isProcessableInst = isProcessableInstance(node, skipInstance);
    const nodeIsShape = isShapeExceptDivable(node);
    let exportAsSvg = nodeIsShape;
    let obj: any;
    if (isProcessableInst) {
      context = { ...context, nodeOfComp: node.mainComponent };
    }
    const { nodeOfComp, textStyles, fillStyles, strokeStyles, effectStyles, gridStyles, isComp, intermediateNodes } =
      context;
    // It is undefined if we are not in an instance yet
    const nextIntermediateNode = intermediateNodes[1] as SceneNode | PageNode | undefined;

    if (isComp) skipParent = false;
    const isInInstance = !!nodeOfComp;
    if (!exportAsSvg && shouldGroupAsSVG(node)) {
      exportAsSvg = true;
    }
    const nodeIsLayout = isLayout(node);
    const isSvgWithRotation = exportAsSvg && nodeIsLayout && node.rotation;
    let type = node.type as keyof typeof nodeDefaults;
    if (!nodeDefaults[type]) {
      warnNode(node, 'Node type is not found in the defaults available. Falling back to Frame defaults.');
      type = 'FRAME';
    }
    const currentNodeDefaults = nodeDefaults[type];

    function setProp(obj: any, key: string, value: any) {
      const k = key as NodeKeys;
      const compVal = nodeOfComp?.[k];
      if (
        (!isInInstance && (propsNeverOmitted.has(k) || !equal(value, currentNodeDefaults[k]))) ||
        (isInInstance && (componentPropsNotInherited.has(k) || !equal(value, compVal)))
      ) {
        obj[k] = value;
      }
    }

    obj = { id: node.id };
    setProp(obj, 'type', type);

    perfMeasure(`Time spent - ${prevNode?.name} => ${node.name}`, 0.5);
    prevNode = node;
    const attributesWhitelist = nodeAttributes[type];
    for (const attribute of attributesWhitelist) {
      try {
        const val = (node as any)[attribute];
        if (typeof val === 'symbol') {
          setProp(obj, attribute, 'Mixed');
        } else {
          setProp(obj, attribute, val);
        }
      } catch (err) {
        console.warn('Error reading attribute', attribute, 'on node', node.name, type, node.id, '-', err);
        // setProp(obj, name, undefined); // or nothing?
        // obj[attribute] = undefined;
      }
    }
    // const measured = perfMeasure('After loop');
    // if (measured != null && measured > 2) return;

    const hasComponentPropertyDefinitions = isComponentSet(node) || (isComponent(node) && !isComponentSet(node.parent));
    if (hasComponentPropertyDefinitions) {
      setProp(obj, 'componentPropertyDefinitions', node.componentPropertyDefinitions);
    }

    const isTxt = isText(node);
    if (isTxt) {
      const segments = node.getStyledTextSegments(rangeProps);
      // We may want to skip it for components (instances define the text used). Style usage to review.
      obj._textSegments = segments;
      for (const { textStyleId, fillStyleId } of segments) {
        addStyle(textStyles, textStyleId);
        addStyle(fillStyles, fillStyleId);
      }
    }

    // Figma Tokens
    const tokens = exportNodeTokens(node);
    if (tokens) {
      obj._tokens = tokens;
      // Should we use setProp here? No real default except undefined, already handled.
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
    // Instance and component nodes should not be directly exported as SVGs to avoid conflicts with components processing when generating code + avoid the risk of working directly with SVG as root when dealing with component swaps and CSS overrides.
    // It could be changed if we want a component's root node to be the SVG directly, but it would require a bit refactoring.
    if (isInstance(node) || isComponent(node) || isPage(node) || !node.visible) {
      exportAsSvg = false;
    }
    if (exportAsSvg) {
      setProp(obj, 'type', 'VECTOR' as VectorNode['type']);
      // If we are in an instance, we don't need to export the SVG. For now, it is assumed to be the same as the component's SVG. It will be copied from the component.
      // In reality, there could be overrides in Figma (e.g. fills) on parts that are included in the exported SVG. Such overrides won't be captured. To capture them, we need to reexport as SVG on all instances, or if a change is detected vs the component.
      if (flags.extractInstanceSVG || !isInInstance) {
        perfMeasure('Before svg equality');
        const svgAreEqual = areSvgEqual(node as LayoutNode, nextIntermediateNode as LayoutNode | undefined);
        perfMeasure(
          `==> After svg equality: ${node.name} // ${nextIntermediateNode?.name} // ${
            svgAreEqual ? '(equal)' : '- NOT EQUAL'
          }`,
        );
        let nodeToExport = node as LayoutNode;
        let copyForExport: LayoutNode | undefined = undefined;
        if (!svgAreEqual) {
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

            // Edit: always clone when we need to export, so that border fixes don't affect the original SVG.
            // if (isComp) {
            // The real condition is if we are in another file, which can happen when parsing the main component from an instance. If we can detect it, we should improve the condition to avoid copying nodes for components that are in the same file.
            [nodeToExport, copyForExport] = ensureCloned(nodeToExport, copyForExport);
            // }
            if (isBlendMixin(nodeToExport) && nodeToExport.effects?.length) {
              [nodeToExport, copyForExport] = ensureCloned(nodeToExport, copyForExport);
              (nodeToExport as ShapeNode).effects = [];
              (nodeToExport as ShapeNode).effectStyleId = '';
            }
            if (!isPage(node)) {
              const { rotation } = parseTransformationMatrix(node.absoluteTransform);
              if (rotation !== 0) {
                [nodeToExport, copyForExport] = ensureCloned(nodeToExport, copyForExport);
              }
            }
            if (isGroup(nodeToExport)) {
              // Interesting properties like constraints are in the children nodes. Let's make a copy.
              setProp(obj, 'constraints', (nodeToExport.children[0] as ConstraintMixin)?.constraints);
            }

            // Change all stroke positions to center to fix the bad SVG export bug
            fixStrokeAlign(nodeToExport);

            // TextDecoder is undefined, I don't know why. We are supposed to be in a modern JS engine. So we use a JS replacement instead.
            // But ideally, we should do:
            // obj._svg = new TextDecoder().decode(await nodeToExport.exportAsync({ format: 'SVG' }));

            try {
              setProp(
                obj,
                '_svg',
                utf8ArrayToStr(await nodeToExport.exportAsync({ format: 'SVG', useAbsoluteBounds: false /* true */ })),
              );
            } catch (error) {
              warnNode(node, 'Failed to export node as SVG, ignoring.');
              console.error(error);
            }
          } finally {
            removeNode(copyForExport);
          }
        }
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

    if (isSvgWithRotation) {
      const { rotation, width, height } = obj;
      const rotationRad = (rotation * Math.PI) / 180;
      // Adjust x/y depending on the rotation. Figma's x/y are the coordinates of the original top/left corner after rotation. In CSS, it's the top-left corner of the final square containing the SVG.
      // Sounds a bit complex. We could avoid that by rotating in CSS instead. But It will have other side effects, like the space used in the flow (different in Figma and CSS).
      if (rotation >= -180 && rotation <= -90) {
        setProp(obj, 'height', Math.abs(width * Math.sin(rotationRad)) + Math.abs(height * Math.cos(rotationRad)));
        setProp(obj, 'width', Math.abs(width * Math.cos(rotationRad)) + Math.abs(height * Math.sin(rotationRad)));
        setProp(obj, 'x', obj.x - obj.width);
        setProp(obj, 'y', obj.y - getOppositeSide(90 - (rotation + 180), height));
      } else if (rotation > -90 && rotation <= 0) {
        setProp(obj, 'x', obj.x + getOppositeSide(rotation, height));
        setProp(obj, 'height', Math.abs(width * Math.sin(rotationRad)) + Math.abs(height * Math.cos(rotationRad)));
        setProp(obj, 'width', Math.abs(width * Math.cos(rotationRad)) + Math.abs(height * Math.sin(rotationRad)));
        // Do nothing for y
      } else if (rotation > 0 && rotation <= 90) {
        setProp(obj, 'width', Math.abs(width * Math.sin(rotationRad)) + Math.abs(height * Math.cos(rotationRad)));
        setProp(obj, 'height', Math.abs(width * Math.cos(rotationRad)) + Math.abs(height * Math.sin(rotationRad)));
        // Do nothing for x
        setProp(obj, 'y', obj.y - getOppositeSide(rotation, width));
      } else if (rotation > 90 && rotation <= 180) {
        setProp(obj, 'height', Math.abs(width * Math.sin(rotationRad)) + Math.abs(height * Math.cos(rotationRad)));
        setProp(obj, 'width', Math.abs(width * Math.cos(rotationRad)) + Math.abs(height * Math.sin(rotationRad)));
        setProp(obj, 'x', obj.x - getOppositeSide(rotation - 90, width));
        setProp(obj, 'y', obj.y - obj.height);
      }

      // Here, the rotation is already included in the exported SVG. We shouldn't keep the CSS rotation.
      // Update: resetting here should not be required anymore. We skip it in the API. To test, confirm, and delete this code in a few weeks.
      // obj.rotation = 0;
    }

    if (node.parent && !skipParent) {
      obj.parent = { id: node.parent.id, type: node.parent.type, name: node.parent.name };
    }
    if (isChildrenMixin(node) && !exportAsSvg && !skipChildren) {
      const promises: ReturnType<typeof nodeToObjectRec>[] = [];
      assertChildrenMixinOrUndef(nextIntermediateNode);
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];

        const nextCompChildNode = nextIntermediateNode?.children[i];
        const isOriginalInstance = !nextIntermediateNode || checkIsOriginalInstance(child, nextCompChildNode);

        let childIntermediateNodes: IntermediateNodes;
        if (!isOriginalInstance) {
          childIntermediateNodes = [child];
        } else {
          // Replace intermediate nodes with the child at the same location:
          childIntermediateNodes = mapToChildrenAtPosition(intermediateNodes, i);
          const isProcessableInst = isProcessableInstance(child, skipInstance);
          if (isProcessableInst) {
            childIntermediateNodes = [...childIntermediateNodes, child.mainComponent];
          }
        }

        if (nodeOfComp && !isChildrenMixin(nodeOfComp)) {
          warnNode(node, 'BUG Instance node has children, but the corresponding component node does not.');
          throw new Error('BUG Instance node has children, but the corresponding component node does not.');
        }
        context = {
          ...context,
          nodeOfComp: nodeOfComp?.children[i],
          intermediateNodes: childIntermediateNodes,
        };
        promises.push(nodeToObjectRec(child, context, options));
      }
      obj.children = (await Promise.all(promises)).filter(child => !!child);
    }

    if (isProcessableInst) {
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
        // We should assign a component, but it is only available after the await below. And we use the dictionary to prevent double processing. We set a boolean for the moment to prevent the double processing, and once we have the component, it is assigned instead.
        context.components[id] = true as any;
        const { nodeOfComp, ...compContext } = context;
        compContext.isComp = true;
        compContext.intermediateNodes = [node.mainComponent];
        const comp = (await nodeToObjectRec(node.mainComponent, compContext, options)) as
          | ComponentNodeNoMethod
          | undefined;
        if (comp) {
          if (context.components[id]) {
            console.warn('Component', comp.name, 'already referenced. It was certainly processed twice.');
          }
          context.components[id] = comp;
        } else {
          // If undefined, there was an error (processed separately). Remove from the dictionary of components.
          console.warn(
            'Component for node ',
            node.mainComponent.name,
            'is undefined. There was certainly an error. Removing from the components map.',
          );
          delete context.components[id];
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

function checkIsOriginalInstance(node: SceneNode, nextNode: SceneNode | undefined) {
  if (!node) {
    throw new Error(`BUG [checkIsOriginalInstance] node is undefined.`);
  }
  if (!nextNode) {
    throw new Error(`BUG [checkIsOriginalInstance] nextNode is undefined.`);
  }
  const nodeIsInstance = isInstance(node);
  const nextNodeIsInstance = isInstance(nextNode);
  if (nodeIsInstance !== nextNodeIsInstance) {
    throw new Error(
      `BUG nodeIsInstance: ${nodeIsInstance} but nextNodeIsInstance: ${nextNodeIsInstance}, althought they are supposed to be the same.`,
    );
  }
  return !nodeIsInstance || !nextNodeIsInstance || node.mainComponent!.id === nextNode.mainComponent!.id; // = not swapped in Figma
}

// Assertion in control flow analysis
function assertChildrenMixinOrUndef(node: BaseNode | ChildrenMixin | Nil): asserts node is ChildrenMixin | undefined {
  if (node && !isChildrenMixin(node)) {
    throw new Error(`node ${(node as BaseNode).name} is not a ChildrenMixin`);
  }
}

function mapToChildrenAtPosition(intermediateNodes: IntermediateNodes, position: number) {
  return intermediateNodes.map(intermediateNode => {
    // intermediateNode is undefined if an instance was swapped with another.
    if (!isChildrenMixin(intermediateNode)) {
      // warnNode(node, 'BUG Instance node has children, but the corresponding component node does not.');
      throw new Error('BUG Instance node has children, but the corresponding component node does not.');
    }
    const childIntermediateNode = intermediateNode.children[position];
    return childIntermediateNode;
  });
}

function shouldGroupAsSVG(node: SceneNode | PageNode) {
  if (!isChildrenMixin(node) || !node.children.length) return false;
  // If only one child, don't group as SVG
  // TODO reactivate after having fixed the divider bug on Clément's wireframe
  // if (!(node.children.length > 1)) return false;

  // The rectangle is neutral. If mixed with shapes only, it allows grouping as SVG.
  // If no other shapes, it should generate divs.
  let foundNonRectangleShape = false;
  // If one of the children is not a shape (or neutral), don't group as SVG
  for (const child of node.children) {
    const isShape0 = isShapeExceptDivable(child);
    if (isShape0 && !foundNonRectangleShape) foundNonRectangleShape = true;
    const isShape = isShape0 || isRectangleWithoutImage(child) || (isGroup(child) && shouldGroupAsSVG(child));
    if (!isShape) {
      return false;
    }
  }
  // Otherwise, group as SVG if there is at least one shape (apart from neutrals).
  // If neutrals only, render as HTML (div).
  return foundNonRectangleShape;
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
  try {
    if (!flags.fixSvgStrokePositionBug) return;
    if (isMinimalStrokesMixin(node)) {
      node.strokeAlign = 'CENTER';
    }
    if (isChildrenMixin(node)) {
      for (const child of node.children) {
        fixStrokeAlign(child);
      }
    }
  } catch (error) {
    warnNode(
      node,
      'Fix stroke align failed. Maybe the node is a read-only component in another file. To fix later by copying it here in addition to the top level node copy.',
    );
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

type WithCompMixin = SceneNode & {
  mainComponent: ComponentNode;
};
function isProcessableInstance(node: SceneNode | PageNode, skipInstance: boolean): node is WithCompMixin {
  return !!(isInstance(node) && node.mainComponent && !skipInstance);
}
