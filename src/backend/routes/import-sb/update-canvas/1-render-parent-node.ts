import { entries } from '../../../../common/general-utils';
import { isFrame, MyCompNode } from '../canvas-utils';
import { RenderContext } from '../import-model';
import { CElementNode, CNode, cssDefaults, isCElementNode } from '../sb-serialize.model';
import { appendChildNodes } from './2-append-child-nodes';
import { horizontalFixedSize, verticalHugContents } from './autolayout-utils';
import { nodeStyles, resizeNode, sizeWithUnitToPx } from './update-canvas-utils';

export async function renderParentNode(node: MyCompNode, sbNodes: CNode[], storyId: string, isVariant?: boolean) {
  try {
    // If the construction of the currentNode is delegated to appendNodes(), we could add CSS defaults within appendNodes() and avoid this extra recursion.
    addCssDefaults(sbNodes, null);

    const padding = 32;

    let maxWidth = -1;
    for (const node of sbNodes) {
      const w = sizeWithUnitToPx(nodeStyles(node, null).width!);
      if (maxWidth < w) {
        maxWidth = w;
      }
    }
    node.fills = [];
    if (maxWidth !== -1) {
      resizeNode(node, maxWidth + padding * 2, node.height);
    }
    // Else it's likely a series of inline elements. Let's hug contents instead of fixed width.
    // TODO review once we better know how to handle those cases.

    // Apply flex. The top container behaves as if the parent had horizontal direction.
    node.layoutMode = 'VERTICAL';
    horizontalFixedSize(node);
    verticalHugContents(node);

    node.paddingBottom = padding;
    node.paddingLeft = padding;
    node.paddingTop = padding;
    node.paddingRight = padding;

    if (!isVariant) {
      // Strokes
      node.strokeAlign = 'INSIDE';
      node.strokeWeight = 1;
      node.dashPattern = [5, 10];
      node.strokes = [
        {
          type: 'SOLID',
          color: { r: 0.5, g: 0.5, b: 0.5 },
          opacity: 1,
        },
      ];
    } else {
      // back to defaults
      node.dashPattern = [];
      node.strokes = [];
    }

    // currentNode.fills = [{
    //   type: 'SOLID',
    //   color: hexToRgb(['FFFFFF', 'FBFBFB', 'F7F7F7'][depth - 1]),
    //   opacity: 1,
    // }];

    node.expanded = false;

    // Delete previous children
    for (const childNode of node.children) {
      console.log('Delete childNode', childNode.name, ':', childNode);
      childNode.remove();
    }

    const context: RenderContext = {
      storyId,
      figmaParentNode: node,
      sbParentNode: null,
      absoluteAncestor: node,
      absoluteAncestorBorders: {
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderRightWidth: 0,
      },
    };
    await appendChildNodes(sbNodes, context);

    // If none of the direct children have fill container for height, we could set currentNode to hug contents (primary axis)
    if (!atLeastOneChildFillsContainerVertically(node)) {
      node.primaryAxisSizingMode = 'AUTO';
    }
  } catch (err) {
    console.error('Error while rendering story', storyId, 'in the root component.');
    // Clean nodes not appended yet because of errors
    // currentNode?.remove();
    throw err;
  }
}

function addCssDefaults(nodes: CNode[], sbParentNode: CElementNode | null) {
  for (const sbNode of nodes) {
    for (const [cssKey, defaultValue] of entries(cssDefaults)) {
      const styles = nodeStyles(sbNode, sbParentNode);
      if (!styles[cssKey]) {
        // @ts-ignore
        styles[cssKey] = defaultValue;
      }
    }
    if (isCElementNode(sbNode) && sbNode.children) {
      addCssDefaults(sbNode.children, sbNode);
    }
  }
}

function atLeastOneChildFillsContainerVertically(currentNode: MyCompNode) {
  for (const child of currentNode.children) {
    if (isFrame(child) && child.layoutMode !== 'NONE' && child.layoutGrow === 1) {
      return true;
    }
  }
  return false;
}
