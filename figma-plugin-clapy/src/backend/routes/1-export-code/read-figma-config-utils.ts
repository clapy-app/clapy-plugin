import equal from 'fast-deep-equal';

import type { Nil } from '../../../common/app-models.js';
import type {
  ComponentNode2,
  ComponentNodeNoMethod,
  Dict,
  ExportImagesFigma,
  FrameNode2,
  InstanceNode2,
  LayoutNode,
  LayoutTypes,
  NodeLight,
  NodeWithDefaults,
  PageNode2,
  SceneNode2,
} from '../../../common/sb-serialize.model.js';
import { nodeDefaults } from '../../../common/sb-serialize.model.js';
import {
  isEmptyFrame,
  isGroup0,
  isInstance,
  isInstance2,
  isLayout2,
  isLine0,
  isRectangle0,
  isShapeExceptDivable,
} from '../../common/node-type-utils.js';

export type AnyNodeOriginal = SceneNode;
export type AnyNode3 = /* SceneNode2 */ Omit<SceneNode2, 'type'> & {
  parent?: NodeLight | AnyNode3; // Should be required, but we will need to fix a few typing issues.
  exportAsSvg?: boolean;
  groupChildrenAsSvg?: boolean;
  type: Exclude<LayoutTypes, 'PAGE'>;
};
export type AnyParent = FrameNode2 | ComponentNode2 | InstanceNode2 | PageNode2;

// const propsNeverOmitted = new Set<keyof SceneNodeNoMethod>(['type']);
// const componentPropsNotInherited = new Set<keyof SceneNodeNoMethod>(['type', 'visible', 'name']);

export interface ExtractBatchContext {
  isRootNodeInComponent: boolean;
  images: ExportImagesFigma;
  /** @deprecated */
  components: Dict<ComponentNodeNoMethod>;
  // nodesCache: Dict<AnyNode2>;
  componentsToProcess: SceneNode[];
  componentsCache: Dict<ComponentNode2>;
  componentsCallbacks: Dict<Array<(comp: ComponentNode2) => void>>;
  // Extract styles to process them later
  textStyles: Dict<TextStyle>;
  fillStyles: Dict<PaintStyle>;
  strokeStyles: Dict<PaintStyle>;
  effectStyles: Dict<EffectStyle>;
  gridStyles: Dict<GridStyle>;
  // VectorRegion fillStyleId
  nodeIdsToExtractAsSVG: Set<string>;
  imageHashesToExtract: Set<string>;
}

export interface ExtractNodeContext {
  extractBatchContext: ExtractBatchContext;
  node: AnyNode3;
  isInInstance?: boolean;
  // When into an instance, we keep track of the corresponding node in the component to find style overrides.
  // The only usage is to avoid writing a value in the extrated JSON. We could replace it with a more relevant
  // node: nextIntermediateNode. But it will require to update the webservice as well. And to avoid issues during
  // the deployment, support both nodeOfComp and nextIntermediateNode as base node in the API.
  nodeOfComp?: AnyNode3;
  nextIntermediateNode?: AnyNode3 | Nil;
  // intermediateNodes: IntermediateNodes;
  isComp?: boolean;
}

export const customCssPluginKey = 'customCss';

export function shouldGroupAsSVG(nodeOriginal: SceneNode): boolean {
  const children = (nodeOriginal as ChildrenMixin).children as SceneNode[] | undefined;
  if (!children) return false;
  // If only one child, don't group as SVG
  // TODO reactivate after having fixed the divider bug on Clément's wireframe
  // if (!(node.children.length > 1)) return false;

  let foundNonNeutralShape = false;
  // If one of the children is not a shape (or neutral), don't group as SVG
  for (const child of children) {
    const { type } = child;
    const childAsFrame = child as FrameNode;
    const { isMask, fills } = childAsFrame;
    const isShape0 = isShapeExceptDivable(type, isMask);
    const isGrp = isGroup0(type);
    if ((isShape0 || isGrp) && !foundNonNeutralShape) foundNonNeutralShape = true;
    const isShape =
      isShape0 ||
      isNeutralShape(type, fills) ||
      ((isGrp || isEmptyFrame(type, fills as Paint[], childAsFrame.strokes, childAsFrame.effects)) &&
        shouldGroupAsSVG(child));
    if (!isShape) {
      return false;
    }
  }
  // Otherwise, group as SVG if there is at least one shape (apart from neutrals).
  // If neutrals only, render as HTML (div).
  return foundNonNeutralShape;
}

// The rectangle and the line are neutral. If mixed with shapes only, it allows grouping as SVG.
// If no other shapes, it should generate divs.
function isNeutralShape(type: SceneNode['type'], fills: FrameNode['fills']) {
  return isRectangleWithoutImage(type, fills as Paint[]) || isLine0(type);
}

type WithCompMixin2 = AnyNode3 & {
  mainComponent: NodeLight;
};
export function isProcessableInstance2(node: any, mainComponent?: ComponentNode | null): node is WithCompMixin2 {
  return !!(isInstance(node) && (mainComponent || node.mainComponent));
}

function isRectangleWithoutImage(type: string, fills: Paint[] | undefined): boolean {
  if (!isRectangle0(type)) {
    return false;
  }
  if (!Array.isArray(fills)) {
    return true;
  }
  for (const fill of fills) {
    if (fill.visible && fill.type === 'IMAGE') {
      return false;
    }
  }
  return true;
}

export function checkIsOriginalInstance2(node: AnyNode3, nextNode: AnyNode3 | undefined) {
  if (!node) {
    throw new Error(`BUG [checkIsOriginalInstance2] node is undefined.`);
  }
  if (!nextNode) {
    throw new Error(`BUG [checkIsOriginalInstance2] nextNode is undefined.`);
  }
  const nodeIsInstance = isInstance2(node);
  const nextNodeIsInstance = isInstance2(nextNode);
  if (nodeIsInstance !== nextNodeIsInstance) {
    throw new Error(
      `BUG nodeIsInstance: ${nodeIsInstance} but nextNodeIsInstance: ${nextNodeIsInstance}, althought they are supposed to be the same.`,
    );
  }
  return !nodeIsInstance || !nextNodeIsInstance || node.mainComponent!.id === nextNode.mainComponent!.id; // = not swapped in Figma
}

const propsNeverOmitted = new Set<keyof AnyNode3>(['type']);
const componentPropsNotInherited = new Set<keyof AnyNode3>(['type', 'visible', 'name']);

export function setProp2(node: AnyNode3, nodeOfComp: AnyNode3 | undefined, key: string, value: any) {
  const k = key as keyof NodeWithDefaults;
  const compVal = nodeOfComp?.[k];
  const isInInstance = !!nodeOfComp;
  const currentNodeDefaults = nodeDefaults[node.type as LayoutNode['type']];
  if (
    (!isInInstance && (propsNeverOmitted.has(k) || !equal(value, currentNodeDefaults[k]))) ||
    (isInInstance && (componentPropsNotInherited.has(k) || !equal(value, compVal)))
  ) {
    (node as any)[k] = value;
  }
}

export function patchDimensionFromRotation(node: AnyNode3) {
  const { exportAsSvg } = node;
  const nodeIsLayout = isLayout2(node);
  const isSvgWithRotation = exportAsSvg && nodeIsLayout && node.rotation;

  if (isSvgWithRotation) {
    const { rotation, width, height } = node;
    const rotationRad = (rotation * Math.PI) / 180;
    // Adjust x/y depending on the rotation. Figma's x/y are the coordinates of the original top/left corner after rotation. In CSS, it's the top-left corner of the final square containing the SVG.
    // Sounds a bit complex. We could avoid that by rotating in CSS instead. But It will have other side effects, like the space used in the flow (different in Figma and CSS).
    if (rotation >= -180 && rotation <= -90) {
      node.height = Math.abs(width * Math.sin(rotationRad)) + Math.abs(height * Math.cos(rotationRad));
      node.width = Math.abs(width * Math.cos(rotationRad)) + Math.abs(height * Math.sin(rotationRad));
      node.x = node.x - node.width;
      node.y = node.y - getOppositeSide(90 - (rotation + 180), height);
    } else if (rotation > -90 && rotation <= 0) {
      node.x = node.x + getOppositeSide(rotation, height);
      node.height = Math.abs(width * Math.sin(rotationRad)) + Math.abs(height * Math.cos(rotationRad));
      node.width = Math.abs(width * Math.cos(rotationRad)) + Math.abs(height * Math.sin(rotationRad));
      // Do nothing for y
    } else if (rotation > 0 && rotation <= 90) {
      node.width = Math.abs(width * Math.sin(rotationRad)) + Math.abs(height * Math.cos(rotationRad));
      node.height = Math.abs(width * Math.cos(rotationRad)) + Math.abs(height * Math.sin(rotationRad));
      // Do nothing for x
      node.y = node.y - getOppositeSide(rotation, width);
    } else if (rotation > 90 && rotation <= 180) {
      node.height = Math.abs(width * Math.sin(rotationRad)) + Math.abs(height * Math.cos(rotationRad));
      node.width = Math.abs(width * Math.cos(rotationRad)) + Math.abs(height * Math.sin(rotationRad));
      node.x = node.x - getOppositeSide(rotation - 90, width);
      node.y = node.y - node.height;
    }
  }
}

function getOppositeSide(rotation: number, adjacent: number) {
  const rotationRad = (rotation * Math.PI) / 180;
  const tangent = Math.sin(rotationRad);
  return tangent * adjacent;
}
