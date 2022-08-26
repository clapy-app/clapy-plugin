import type {
  BaseNode2,
  FrameNode2,
  GroupNode2,
  LineNode2,
  RectangleNode2,
  SceneNode2,
  VectorNode2,
} from '../../../common/sb-serialize.model.js';
import {
  isBlendMixin,
  isChildrenMixin2,
  isFrame2,
  isLayout,
  isMinimalFillsMixin,
  isMinimalStrokesMixin,
} from '../../common/node-type-utils.js';
import { generateNode } from './3-create-parent-nodes.js';
import type { FigmaConfigContext, TextNode2, WriteableSceneNodeKeys } from './utils.js';
import { appendChild, ignoredAttributes, ensureFontIsLoaded } from './utils.js';

export function hydrateNewNode(newChild: BaseNode2, childConfig: BaseNode2, isSvg?: boolean) {
  for (const [attr, val] of Object.entries(childConfig)) {
    const attrTyped = attr as WriteableSceneNodeKeys;
    if ((childConfig as any)[attrTyped] && !ignoredAttributes.has(attr)) {
      (newChild as any)[attrTyped] = val;
    }
    //! update backend to store full configs with defaults that way this isLayout doesn't break.
    if (isLayout(newChild) && isLayout(childConfig)) {
      newChild.resize(childConfig.width || 0, childConfig.height || 0);
    }

    if (isMinimalFillsMixin(newChild) && isMinimalFillsMixin(childConfig)) {
      newChild.fills = childConfig.fills || [];
    }
    if (isMinimalStrokesMixin(newChild) && isMinimalStrokesMixin(childConfig)) {
      newChild.strokes = childConfig.strokes || [];
    }
    if (isBlendMixin(newChild) && isBlendMixin(childConfig)) {
      newChild.effects = childConfig.effects || [];
    }
  }
}

export async function generateGroupNode(
  parentNode: BaseNode & ChildrenMixin,
  node: GroupNode2,
  ctx: FigmaConfigContext,
) {
  return await generateGroupChildNodes(parentNode, node, ctx);
}

export async function generateFrameNode(
  parentNode: BaseNode & ChildrenMixin,
  node: FrameNode2,
  ctx: FigmaConfigContext,
) {
  const frame = figma.createFrame();
  appendChild(parentNode, frame);
  hydrateNewNode(frame, node);
  await generateChildNodes(frame, node, ctx);
  return frame;
}

export async function generateTextNode(parentNode: ChildrenMixin, node: TextNode2) {
  await ensureFontIsLoaded({ family: 'Inter', style: 'Regular' });
  const text = figma.createText();
  parentNode.appendChild(text);

  hydrateNewNode(text, node);

  for (const textSegment of node._textSegments) {
    await ensureFontIsLoaded(textSegment.fontName);
    const start = textSegment.start;
    const end = textSegment.end;
    text.insertCharacters(start, textSegment.characters);
    text.setRangeFontSize(start, end, textSegment.fontSize);
    text.setRangeFontName(start, end, textSegment.fontName);
    text.setRangeTextCase(start, end, textSegment.textCase);
    text.setRangeTextDecoration(start, end, textSegment.textDecoration);
    text.setRangeLetterSpacing(start, end, textSegment.letterSpacing);
    text.setRangeLineHeight(start, end, textSegment.lineHeight);
    text.setRangeHyperlink(start, end, textSegment.hyperlink);
    text.setRangeFills(start, end, textSegment.fills);
    text.setRangeTextStyleId(start, end, textSegment.textStyleId);
    text.setRangeFillStyleId(start, end, textSegment.fillStyleId);
    text.setRangeListOptions(start, end, textSegment.listOptions);
    text.setRangeIndentation(start, end, textSegment.indentation);
  }
  return text;
}

export async function generateRectancle(parentNode: ChildrenMixin, node: RectangleNode2) {
  const rectangle = figma.createRectangle();
  parentNode.appendChild(rectangle);
  hydrateNewNode(rectangle, node);
  return rectangle;
}

export async function generateLineNode(parentNode: ChildrenMixin, node: LineNode2) {
  const line = figma.createLine();
  parentNode.appendChild(line);
  hydrateNewNode(line, node);

  return line;
}

export async function generateVectorNode(parentNode: ChildrenMixin, node: VectorNode2, ctx: FigmaConfigContext) {
  if (ctx.svgs == null) {
    throw new Error('Problem with this config, found vectorNode to render but svgs array is empty.');
  }

  const vector = figma.createNodeFromSvg(ctx.svgs[node.id]['svg']);
  parentNode.appendChild(vector);
  hydrateNewNode(vector, node, true);

  // resizeNode(vector.children[0], node);
  vector.rotation = 0;
  return vector;
}
async function generateChildNodes(
  parentNode: BaseNode & ChildrenMixin,
  nodeConfig: SceneNode2,
  ctx: FigmaConfigContext,
) {
  if (isFrame2(nodeConfig)) {
    for (let child of nodeConfig.children) {
      const element = await generateNode(parentNode, child, ctx);
      if (element) {
        appendChild(parentNode, element);
      }
    }
  }
}

async function generateGroupChildNodes(
  parentNode: BaseNode & ChildrenMixin,
  nodeConfig: SceneNode2,
  ctx: FigmaConfigContext,
) {
  let groupElements: BaseNode[] = [];

  if (isChildrenMixin2(nodeConfig)) {
    for (let child of nodeConfig.children) {
      const element = await generateNode(parentNode, child, ctx);
      if (element) groupElements.push(element);
    }
  }

  const group = figma.group(groupElements, parentNode);
  hydrateNewNode(group, nodeConfig);
  return group;
}
