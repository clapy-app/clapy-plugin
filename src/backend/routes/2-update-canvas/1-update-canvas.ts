import { isComponentSet } from '../../common/canvas-utils';
import { CNode } from '../../common/sb-serialize.model';
import { renderParentNode } from './3-render-parent-node';
import { getPageAndNode } from './get-page-and-node';

export async function updateCanvas(sbNodes: CNode[], figmaId: string, storyId: string, pageId: string) {
  try {
    const { page, node } = getPageAndNode(pageId, figmaId, storyId);
    if (!page || !node || !node.parent) {
      return;
    }
    if (isComponentSet(node)) {
      throw new Error(`Variants update not supported yet.`);
    }

    await renderParentNode(node, sbNodes, storyId);
  } finally {
    figma.commitUndo();
  }
}
