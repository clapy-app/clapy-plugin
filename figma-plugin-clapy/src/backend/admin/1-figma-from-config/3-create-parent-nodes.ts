import type { FigmaConfigContext } from './1-read-figma-config.js';
import {
  generateFrameNode,
  generateLineNode,
  generateRectancle,
  generateTextNode,
  generateVectorNode,
  hydrateNewNode,
} from './4-create-child-nodes.js';

export async function generateNode(page: PageNode, figmaConfig: any, ctx: FigmaConfigContext) {
  const root = (figmaConfig.root || figmaConfig) as SceneNode;

  let element;
  switch (root.type) {
    case 'FRAME':
      {
        const frame = await generateFrameNode(root);
        page.appendChild(frame);
        for (let child of root.children) {
          const element = await generateNode(page, child, ctx);
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
          const element = await generateNode(page, child, ctx);
          if (element) groupElements.push(element);
        }
        const group = figma.group(groupElements, page);
        hydrateNewNode(group, root);
        return group;
      }
      break;
    case 'RECTANGLE':
      element = await generateRectancle(root);
      page.appendChild(element);
      break;
    case 'TEXT':
      element = await generateTextNode(root);
      page.appendChild(element);
      break;
    case 'LINE':
      element = await generateLineNode(root);
      page.appendChild(element);
      break;
    case 'VECTOR':
      element = await generateVectorNode(root, ctx);
      page.appendChild(element);
      break;
    default:
      break;
  }
  return element;
}
