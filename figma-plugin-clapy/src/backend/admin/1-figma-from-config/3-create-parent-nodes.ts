import {
  generateFrameNode,
  generateGroupNode,
  generateLineNode,
  generateRectancle,
  generateTextNode,
  generateVectorNode,
} from './4-create-child-nodes.js';
import type { FigmaConfigContext, TextNode2 } from './utils.js';

export async function generateNode(page: PageNode, root: SceneNode, ctx: FigmaConfigContext) {
  switch (root.type) {
    case 'FRAME':
      return await generateFrameNode(page, root, ctx);
    case 'GROUP':
      return await generateGroupNode(page, root, ctx);
    case 'RECTANGLE':
      return await generateRectancle(page, root);
    case 'TEXT':
      return await generateTextNode(page, root as TextNode2);
    case 'LINE':
      return await generateLineNode(page, root);
    case 'VECTOR':
      return await generateVectorNode(page, root, ctx);
    default:
      return undefined;
  }
}
