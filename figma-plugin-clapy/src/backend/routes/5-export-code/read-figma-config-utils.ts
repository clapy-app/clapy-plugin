import equal from 'fast-deep-equal';

import { isArrayOf } from '../../../common/general-utils.js';
import type {
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
  isRectangle2,
  isShapeExceptDivable,
} from '../../common/node-type-utils.js';

export type AnyNodeOriginal = SceneNode;
export type AnyNode3 = /* SceneNode2 */ Omit<SceneNode2, 'type'> & {
  parent?: NodeLight; // Should be required, but we will need to fix a few typing issues.
  exportAsSvg?: boolean;
  type: LayoutTypes;
};

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
export function isProcessableInstance2(node: AnyNode3, mainComponent?: ComponentNode | null): node is WithCompMixin2 {
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

export function checkIsOriginalInstance2(node: AnyNode3, nextNode: NodeLight | undefined) {
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

export function setProp2(node: AnyNode3, key: string, value: any, nodeOfComp: AnyNode3 | undefined) {
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
