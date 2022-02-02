import { isFrame, isLayout } from './canvas-utils';
import { RenderContext } from './import-model';
import { getCompFrame } from './import-sb-detail';
import { CNode } from './sb-serialize.model';
import { appendNodes } from './update-canvas-append-nodes';
import { sizeWithUnitToPx } from './update-canvas-utils';


export async function updateCanvas(sbNodes: CNode[], figmaId: string, storyId: string) {
  try {
    let currentNode = figma.getNodeById(figmaId);

    if (!currentNode) {
      console.warn('Node to update not found by Figma ID, checking by storyId.');
      currentNode = getCompFrame(figma.currentPage, storyId);
    }
    if (!currentNode) {
      console.warn('Node to update still not found, ID:', figmaId, '- recreating it.');
      currentNode = figma.createFrame();
      currentNode.y = 700;
      figma.currentPage.appendChild(currentNode);
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

      currentNode.remove();
      currentNode = f;
      if (i == null || i === -1) {
        console.warn('Node to update not found in its parent\'s children or no parent, ID:', figmaId, '- pushing the new frame at the end of the parent or page.');
        parent.appendChild(currentNode);
      } else {
        parent.insertChild(i, currentNode);
      }
    }

    let maxWidth = -1;
    for (const node of sbNodes) {
      const w = sizeWithUnitToPx(node.styles.width!);
      if (maxWidth < w) {
        maxWidth = w;
      }
    }
    currentNode.fills = [];
    currentNode.resizeWithoutConstraints(maxWidth, currentNode.height);
    // Apply flex. The top container behaves as if the parent had horizontal direction.
    currentNode.layoutMode = 'VERTICAL';
    // Width: fixed
    currentNode.layoutGrow = 0;
    currentNode.counterAxisSizingMode = 'FIXED';
    // Height: hug content
    currentNode.layoutAlign = 'INHERIT';
    currentNode.primaryAxisSizingMode = 'AUTO';

    // Delete previous children
    for (const node of currentNode.children) {
      node.remove();
    }

    const context: RenderContext = {
      figmaParentNode: currentNode,
      sbParentNode: null,
      absoluteAncestor: currentNode,
      absoluteAncestorBorders: {
        borderBottomWidth: 0, borderLeftWidth: 0, borderTopWidth: 0, borderRightWidth: 0,
      },
    };
    await appendNodes(sbNodes, context);

  } finally {
    figma.commitUndo();
  }
}