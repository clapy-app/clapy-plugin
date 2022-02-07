import { getPageById, isFrame, isLayout } from './canvas-utils';
import { RenderContext } from './import-model';
import { getCompNode } from './import-sb-detail';
import { CNode, cssDefaults, isCElementNode } from './sb-serialize.model';
import { appendNodes } from './update-canvas-append-nodes';
import { sizeWithUnitToPx } from './update-canvas-utils';


export async function updateCanvas(sbNodes: CNode[], figmaId: string, storyId: string, pageId: string) {
  try {
    const page = pageId ? getPageById(pageId) : figma.currentPage;
    let currentNode = figma.getNodeById(figmaId);
    try {

      if (!currentNode) {
        console.warn('Node to update not found by Figma ID, checking by storyId.');
        // Passing a container more specific than `page` may optimise a bit.
        currentNode = getCompNode(page, page, storyId);
      }
      if (!currentNode) {
        console.warn('Node to update still not found, ID:', figmaId, '- recreating it.');
        // TODO review with the container logic
        currentNode = figma.createFrame();
        currentNode.y = 700;
        page.appendChild(currentNode);
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
        const parent = currentNode.parent || page;
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

      addCssDefaults(sbNodes);

      const padding = 32;

      let maxWidth = -1;
      for (const node of sbNodes) {
        const w = sizeWithUnitToPx(node.styles.width!);
        if (maxWidth < w) {
          maxWidth = w;
        }
      }
      currentNode.fills = [];
      if (maxWidth !== -1) {
        currentNode.resizeWithoutConstraints(maxWidth + padding * 2, currentNode.height);
      }
      // Else it's likely a series of inline elements. Let's hug contents instead of fixed width.
      // TODO review once we better know how to handle those cases.

      // Apply flex. The top container behaves as if the parent had horizontal direction.
      currentNode.layoutMode = 'VERTICAL';
      // Width: fixed
      currentNode.layoutGrow = 0;
      currentNode.counterAxisSizingMode = maxWidth !== -1 ? 'FIXED' : 'AUTO';
      // Height: hug content
      currentNode.layoutAlign = 'INHERIT';
      currentNode.primaryAxisSizingMode = 'AUTO';

      currentNode.paddingBottom = padding;
      currentNode.paddingLeft = padding;
      currentNode.paddingTop = padding;
      currentNode.paddingRight = padding;
      currentNode.strokeAlign = 'INSIDE';
      currentNode.strokeWeight = 1;
      currentNode.dashPattern = [5, 10];
      currentNode.strokes = [{
        type: 'SOLID',
        color: { r: 0.5, g: 0.5, b: 0.5 },
        opacity: 1,
      }];
      // currentNode.fills = [{
      //   type: 'SOLID',
      //   color: hexToRgb(['FFFFFF', 'FBFBFB', 'F7F7F7'][depth - 1]),
      //   opacity: 1,
      // }];

      // Delete previous children
      for (const node of currentNode.children) {
        node.remove();
      }
    } catch (err) {
      console.error('Error while rendering story', storyId, 'in the root component.');
      // Clean nodes not appended yet because of errors
      currentNode?.remove();
      throw err;
    }

    const context: RenderContext = {
      storyId,
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

function addCssDefaults(nodes: CNode[]) {
  for (const sbNode of nodes) {
    for (const [cssKey, defaultValue] of Object.entries(cssDefaults)) {
      if (!sbNode.styles[cssKey]) {
        sbNode.styles[cssKey] = defaultValue;
      }
    }
    if (isCElementNode(sbNode) && sbNode.children) {
      addCssDefaults(sbNode.children);
    }
  }
}
