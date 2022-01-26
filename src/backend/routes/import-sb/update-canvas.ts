import { isFrame, isLayout } from './canvas-utils';
import { CNode, isCElementNode, isCTextNode } from './sb-serialize.model';

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

    await appendNodes(currentNode, sbNodes);

    console.log('update canvas:', sbNodes, figmaId);
    console.log('figma node:', figma.getNodeById(currentNode.id));
  } finally {
    figma.commitUndo();
  }
}

async function appendNodes(figmaParentNode: FrameNode, sbNodes: CNode[], fontLoaded?: boolean) {

  for (const sbNode of sbNodes) {
    if (isCTextNode(sbNode)) {
      const node = figma.createText();
      if (!fontLoaded) {
        // figma.loadFontAsync({ family: "Roboto", style: "Regular" })
        await figma.loadFontAsync(<FontName>node.fontName);
        fontLoaded = true;
      }
      node.characters = sbNode.value;
      figmaParentNode.appendChild(node);
    } else if (!isCElementNode(sbNode)) {
      console.warn('Unknown node type:', (sbNode as any).type, '- skipping.');
      continue;
    } else {
      const node = figma.createFrame();
      node.name = sbNode.name;
      const { display, flexDirection, width, height } = sbNode.styles;

      node.layoutMode = display === 'flex' && flexDirection === 'row'
        ? 'HORIZONTAL' : 'VERTICAL';

      const w = parseInt(width);
      const h = parseInt(height);
      if (!isNaN(w) && !isNaN(h)) {
        node.resizeWithoutConstraints(parseInt(width), parseInt(height));
      }

      // node.backgrounds

      figmaParentNode.appendChild(node);
      if (sbNode.children) {
        await appendNodes(node, sbNode.children, fontLoaded);
      }
    }
  }
}

// display,
// flexDirection,
// width,
// height,
// fontSize,
// fontWeight,
// lineHeight,
// textAlign,
// color,
// backgroundColor,
// borderColor,
// borderStyle,
// borderWidth,
// position,
// left,
// top,
// right,
// bottom,