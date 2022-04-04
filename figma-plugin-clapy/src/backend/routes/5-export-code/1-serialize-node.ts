import { getFigmaSelection } from '../../common/selection-utils';
import { nodeToObject } from './nodeToObject';

export function serializeSelectedNode() {
  const selection = getFigmaSelection();
  if (selection?.length !== 1) {
    throw new Error('Selection is not exactly one node, which is not compatible with serialization.');
  }
  const selectedNode = selection[0];
  // We could first check something like getParentCompNode(selectedNode).node in case we want to reuse the notion of components from code>design.
  const node = selectedNode;
  return Promise.all([
    node.parent
      ? nodeToObject(node.parent as SceneNode, { skipChildren: true, skipInstance: true, skipParent: true })
      : null,
    nodeToObject(node),
  ]);
}
