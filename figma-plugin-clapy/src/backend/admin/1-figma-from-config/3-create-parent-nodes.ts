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

export async function generateNode(page: BaseNode & ChildrenMixin, root: SceneNode2, ctx: FigmaConfigContext) {
  if (isFrame2(root)) {
    return await generateFrameNode(page, root, ctx);
  } else if (isGroup2(root)) {
    return await generateGroupNode(page, root, ctx);
  } else if (isRectangle2(root)) {
    return await generateRectancle(page, root);
  } else if (isText2(root)) {
    return await generateTextNode(page, root as TextNode2);
  } else if (isLine(root)) {
    return await generateLineNode(page, root);
  } else if (isVector2(root)) {
    return await generateVectorNode(page, root, ctx);
  } else {
    return undefined;
  }
}
