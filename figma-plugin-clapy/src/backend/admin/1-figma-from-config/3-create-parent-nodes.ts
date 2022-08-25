import type { Nil } from '../../../common/app-models.js';
import type { ExportCodePayload } from '../../../common/sb-serialize.model.js';
import {
  generateFrameNode,
  generateLineNode,
  generateRectancle,
  generateTextNode,
  generateVectorNode,
  hydrateNewNode,
} from './4-create-child-nodes.js';
import type { FigmaConfigContext, textNode2 } from './utils.js';

function checkIfRoot(node: ExportCodePayload | SceneNode): node is ExportCodePayload {
  return Object.keys(node).includes('root');
}

export async function generateNode(
  page: PageNode,
  figmaConfig: ExportCodePayload | SceneNode,
  ctx: FigmaConfigContext,
) {
  const root = checkIfRoot(figmaConfig) ? (figmaConfig.root as SceneNode) : figmaConfig;

  if (!root) return;

  let element: SceneNode | Nil = null;
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
      element = await generateTextNode(root as textNode2);
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
