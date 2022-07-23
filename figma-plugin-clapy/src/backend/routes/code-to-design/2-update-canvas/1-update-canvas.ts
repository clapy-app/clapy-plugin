import type { CNode } from '../../../../common/sb-serialize.model.js';
import { isComponentSet } from '../../../common/node-type-utils.js';
import { renderParentNode } from './3-render-parent-node';
import { getPageAndNode } from './get-page-and-node';

export async function updateCanvas(
  sbNodes: CNode[],
  figmaId: string,
  storyId: string,
  pageId: string,
  skipHistoryCommit?: boolean,
) {
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
    // If the flag is passed, we should make an explicit call to commitUndo from the front. Useful when importing the whole storybook, to avoid polluting the history.
    if (!skipHistoryCommit) {
      figma.commitUndo();
    }
  }
}

export function commitUndo() {
  figma.commitUndo();
}
