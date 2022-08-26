import type { SceneNode2 } from '../../../common/sb-serialize.model.js';
import { isFrame2, isGroup2, isLine, isRectangle2, isText2, isVector2 } from '../../common/node-type-utils.js';
import {
  generateFrameNode,
  generateGroupNode,
  generateLineNode,
  generateRectancle,
  generateTextNode,
  generateVectorNode,
} from './4-create-child-nodes.js';
import type { FigmaConfigContext, TextNode2 } from './utils.js';

export async function generateNode(parentNode: BaseNode & ChildrenMixin, root: SceneNode2, ctx: FigmaConfigContext) {
  if (isFrame2(root)) {
    return await generateFrameNode(parentNode, root, ctx);
  } else if (isGroup2(root)) {
    return await generateGroupNode(parentNode, root, ctx);
  } else if (isRectangle2(root)) {
    return await generateRectancle(parentNode, root, ctx);
  } else if (isText2(root)) {
    return await generateTextNode(parentNode, root as TextNode2, ctx);
  } else if (isLine(root)) {
    return await generateLineNode(parentNode, root, ctx);
  } else if (isVector2(root)) {
    return await generateVectorNode(parentNode, root, ctx);
  } else {
    return undefined;
  }
}
