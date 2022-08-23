//-------------------------------------------------------------------------------------------------------------
//-------------------------------Parent node generation functions implementation--------------------------------

import { generateChildNode } from './4-create-child-nodes.js';

//-------------------------------------------------------------------------------------------------------------
export async function generateParentNode(page: PageNode, figmaConfig: any) {
  const root = figmaConfig.root || figmaConfig;
  switch (root!.type) {
    case 'FRAME':
      {
        const frame = await generateFrameNode(root);
        page.appendChild(frame);
        for (let child of root.children) {
          const element = await generateChildNode(page, child);
          if (element) {
            frame.appendChild(element);
          }
        }
        return frame;
      }
      break;
    case 'GROUP':
      {
        let groupElements: BaseNode[] = [];
        for (let child of root.children) {
          const element = await generateChildNode(page, child);
          if (element) groupElements.push(element);
        }
        const group = figma.group(groupElements, page);
        group.name = root!.name;
        return group;
      }
      break;
    case 'COMPONENT':
      //todo
      break;
    default:
      break;
  }
}
async function generateFrameNode(child: FrameNode) {
  const frame = figma.createFrame();
  frame.name = child.name;
  frame.resize(child.width, child.height);
  if (child.x) frame.x = child.x;
  if (child.y) frame.y = child.y;
  if (child.layoutMode) frame.layoutMode = child.layoutMode;
  if (child.clipsContent) frame.clipsContent = child.clipsContent;
  if (child.relativeTransform) frame.relativeTransform = child.relativeTransform;
  if (child.primaryAxisSizingMode) frame.primaryAxisSizingMode = child.primaryAxisSizingMode;
  if (child.fills) {
    frame.fills = child.fills;
  } else {
    frame.fills = [];
  }
  return frame;
}
