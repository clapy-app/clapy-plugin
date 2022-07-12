import equal from 'fast-deep-equal';

import type { Nil } from '../../../common/app-models.js';
import { isArrayOf } from '../../../common/general-utils.js';
import type {
  ComponentNode2,
  ComponentNodeNoMethod,
  Dict,
  ExportImagesFigma,
  LayoutNode,
  LayoutTypes,
  NodeLight,
  NodeWithDefaults,
  RectangleNode2,
  SceneNode2,
} from '../../../common/sb-serialize.model.js';
import { nodeDefaults } from '../../../common/sb-serialize.model.js';
import {
  isChildrenMixin2,
  isGroup2,
  isInstance,
  isInstance2,
  isLayout2,
  isRectangle2,
  isShapeExceptDivable,
} from '../../common/node-type-utils.js';

export type AnyNodeOriginal = SceneNode;
export type AnyNode3 = /* SceneNode2 */ Omit<SceneNode2, 'type'> & {
  parent?: NodeLight; // Should be required, but we will need to fix a few typing issues.
  exportAsSvg?: boolean;
  type: Exclude<LayoutTypes, 'PAGE'>;
};

// const propsNeverOmitted = new Set<keyof SceneNodeNoMethod>(['type']);
// const componentPropsNotInherited = new Set<keyof SceneNodeNoMethod>(['type', 'visible', 'name']);

export interface ExtractBatchContext {
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

export function shouldGroupAsSVG(node: AnyNode3) {
  if (!isChildrenMixin2(node) || !node.children.length) return false;
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
    const isShape = isShape0 || isRectangleWithoutImage(child) || (isGroup2(child) && shouldGroupAsSVG(child));
    if (!isShape) {
      return false;
    }
  }
  // Otherwise, group as SVG if there is at least one shape (apart from neutrals).
  // If neutrals only, render as HTML (div).
  return foundNonRectangleShape;
}

type WithCompMixin2 = AnyNode3 & {
  mainComponent: NodeLight;
};
export function isProcessableInstance2(node: any, mainComponent?: ComponentNode | null): node is WithCompMixin2 {
  return !!(isInstance(node) && (mainComponent || node.mainComponent));
}

function isRectangleWithoutImage(node: AnyNode3): node is RectangleNode2 {
  if (!isRectangle2(node)) {
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
