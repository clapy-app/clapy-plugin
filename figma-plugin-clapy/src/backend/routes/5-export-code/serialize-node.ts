import { nodeToObject } from '../../common/figma-plugin-helpers/nodeToObject';

export function serializeSelectedNode() {
  if (figma.currentPage.selection?.length !== 1) {
    throw new Error('Selection is not exactly one node, which is not compatible with serialization.');
  }
  const selectedNode = figma.currentPage.selection[0];
  const node = /* getParentCompNode(selectedNode).node || */ selectedNode;
  return nodeToObject(node);
}
