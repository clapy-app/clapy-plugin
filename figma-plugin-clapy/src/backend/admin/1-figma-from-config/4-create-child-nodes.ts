import { generateNode } from './3-create-parent-nodes.js';
import type { FigmaConfigContext, TextNode2, WriteableSceneNodeKeys } from './utils.js';
import { ignoredAttributes, ensureFontIsLoaded } from './utils.js';

export function hydrateNewNode(newChild: SceneNode, childConfig: SceneNode, isSvg?: boolean) {
  for (const [attr, val] of Object.entries(childConfig)) {
    const attrTyped = attr as WriteableSceneNodeKeys;
    if (childConfig[attrTyped] && !ignoredAttributes.has(attr)) {
      (newChild as any)[attrTyped] = val;
    }
    if ('resize' in newChild) {
      let nodeToResize: typeof newChild;
      // if statement to handle svg case
      if (isSvg && newChild.type === 'FRAME' && newChild.children[0].type === 'VECTOR') {
        nodeToResize = newChild.children[0];
      } else {
        nodeToResize = newChild;
      }
      nodeToResize.resize(childConfig.width || 0, childConfig.height || 0);
    }
    if ('fills' in newChild && 'fills' in childConfig && !isSvg) {
      newChild.fills = childConfig.fills || [];
    }
    if ('strokes' in newChild && 'strokes' in childConfig && !isSvg) {
      newChild.strokes = childConfig.strokes || [];
    }
    if ('effects' in newChild && 'effects' in childConfig) {
      newChild.effects = childConfig.effects || [];
    }
  }
}

export async function generateFrameNode(page: PageNode, node: FrameNode, ctx: FigmaConfigContext) {
  const frame = figma.createFrame();
  page.appendChild(frame);
  hydrateNewNode(frame, node);
  for (let child of node.children) {
    const element = await generateNode(page, child, ctx);
    if (element) {
      frame.appendChild(element);
    }
  }
  return frame;
}

export async function generateGroupNode(page: PageNode, node: GroupNode, ctx: FigmaConfigContext) {
  let groupElements: BaseNode[] = [];
  for (let child of node.children) {
    const element = await generateNode(page, child, ctx);
    if (element) groupElements.push(element);
  }
  const group = figma.group(groupElements, page);
  hydrateNewNode(group, node);
  return group;
}

export async function generateTextNode(page: PageNode, node: TextNode2) {
  await ensureFontIsLoaded({ family: 'Inter', style: 'Regular' });
  const text = figma.createText();
  page.appendChild(text);

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

export async function generateRectancle(page: PageNode, node: RectangleNode) {
  const rectangle = figma.createRectangle();
  page.appendChild(rectangle);
  hydrateNewNode(rectangle, node);

  // setFills(rectangle, node);
  // setStrokes(rectangle, node);
  // setEffects(rectangle, node);
  return rectangle;
}

export async function generateLineNode(page: PageNode, node: LineNode) {
  const line = figma.createLine();
  page.appendChild(line);
  hydrateNewNode(line, node);

  return line;
}

export async function generateVectorNode(page: PageNode, node: VectorNode, ctx: FigmaConfigContext) {
  if (ctx.svgs == null) {
    throw new Error('Problem with this config, found vectorNode to render but svgs array is empty.');
  }

  const vector = figma.createNodeFromSvg(ctx.svgs[node.id]['svg']);
  page.appendChild(vector);
  hydrateNewNode(vector, node, true);

  // resizeNode(vector.children[0], node);
  vector.rotation = 0;
  return vector;
}
