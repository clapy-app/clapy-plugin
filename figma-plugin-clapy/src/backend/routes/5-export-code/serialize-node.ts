import { nodeToObject } from '../../common/figma-plugin-helpers/nodeToObject';
import { getFigmaSelection } from '../../common/selection-utils';

export function serializeSelectedNode() {
  const selection = getFigmaSelection();
  if (selection?.length !== 1) {
    throw new Error('Selection is not exactly one node, which is not compatible with serialization.');
  }
  const selectedNode = selection[0];
  const node = /* getParentCompNode(selectedNode).node || */ selectedNode;
  return nodeToObject(node);
}
