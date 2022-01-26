import { isFrame, isLayout } from './canvas-utils';
import { CNode } from './sb-serialize.model';
import { appendNodes } from './update-canvas-append-nodes';
import { sizeWithUnitToPx } from './update-canvas-utils';

export async function updateCanvas(sbNodes: CNode[], figmaId: string) {
  try {
    let currentNode = figma.getNodeById(figmaId);
    if (!currentNode) {
      console.warn('Node to update not found, ID:', figmaId, '- recreating it.');
      currentNode = figma.createFrame();
      figma.currentPage.appendChild(currentNode);
      figma.currentPage.selection = [currentNode];
    }
    if (!isLayout(currentNode)) {
      console.warn('Node to update is not in the layout, skipping. ID:', figmaId);
      return;
    }
    if (!isFrame(currentNode)) {
      console.warn('Node is not a frame, recreating it.');
      const f = figma.createFrame();
      f.x = currentNode.x;
      f.y = currentNode.y;
      f.name = currentNode.name;
      const parent = currentNode.parent || figma.currentPage;
      const i = parent.children.indexOf(currentNode);

      // f.resizeWithoutConstraints(currentNode.width, currentNode.height);
      currentNode.remove();
      currentNode = f;
      if (i == null || i === -1) {
        console.warn('Node to update not found in its parent\'s children or no parent, ID:', figmaId, '- pushing the new frame at the end of the parent or page.');
        parent.appendChild(currentNode);
      } else {
        parent.insertChild(i, currentNode);
      }
      figma.currentPage.selection = [currentNode];
    }

    currentNode.layoutMode = 'VERTICAL';
    // currentNode.counterAxisSizingMode = 'AUTO';
    currentNode.primaryAxisSizingMode = 'AUTO';
    for (const node of sbNodes) {
      const w = sizeWithUnitToPx(node.styles.width!);
      if (currentNode.width < w) {
        currentNode.resizeWithoutConstraints(w, currentNode.height);
      }
    }

    await appendNodes(currentNode, sbNodes);

    console.log('update canvas:', sbNodes, figmaId);
    console.log('figma node:', figma.getNodeById(currentNode.id));
  } finally {
    figma.commitUndo();
  }
}