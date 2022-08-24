//-------------------------------------------------------------------------------------------------------------
//-------------------------------node generation function implementation--------------------------------

import { generateFrameNode, generateRectancle, generateTextNode, hydrateNewNode } from './4-create-child-nodes.js';

//-------------------------------------------------------------------------------------------------------------
export async function generateNode(page: PageNode, figmaConfig: any) {
  const root = figmaConfig.root || figmaConfig;
  let element;
  switch (root.type) {
    case 'RECTANGLE':
      element = await generateRectancle(root);
      page.appendChild(element);
      break;
    case 'TEXT':
      element = await generateTextNode(root);
      page.appendChild(element);
      break;
    case 'FRAME':
      {
        const frame = await generateFrameNode(root);
        page.appendChild(frame);
        for (let child of root.children) {
          const element = await generateNode(page, child);
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
          const element = await generateNode(page, child);
          if (element) groupElements.push(element);
        }
        const group = figma.group(groupElements, page);
        hydrateNewNode(group, root);
        return group;
      }
      break;
    default:
      break;
  }
  return element;
}
