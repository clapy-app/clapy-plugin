import { CNode } from './sb-serialize.model';
import { renderParentNode } from './update-canvas/1-render-parent-node';
import { getPageAndNode } from './update-canvas/get-page-and-node';

export async function updateCanvas(sbNodes: CNode[], figmaId: string, storyId: string, pageId: string) {
  try {
    const { page, node } = getPageAndNode(pageId, figmaId, storyId);
    if (!page || !node || !node.parent) {
      return;
    }

    await renderParentNode(node, sbNodes, storyId);
  } finally {
    figma.commitUndo();
  }
}
