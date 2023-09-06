import type { NodeContext } from '../code.model.js';
import type { SceneNode2, ValidNode } from '../create-ts-compiler/canvas-utils.js';
import { isChildrenMixin } from '../create-ts-compiler/canvas-utils.js';

export function registerReverseOrder(context: NodeContext) {
  context.mustReverseOrder = true;
}

export function applyReverseOrder(context: NodeContext, node: ValidNode) {
  if (context.mustReverseOrder && isChildrenMixin(node)) {
    (node.children as SceneNode2[]).reverse();
  }
}
