import type { OmitMethods } from '../../../common/sb-serialize.model.js';
import type { FigmaConfigContext } from './1-read-figma-config.js';
import { ensureFontIsLoaded, supportsEffects, supportsFills, supportsResize, supportsStrokes } from './utils.js';

interface textNode2 extends TextNode {
  _textSegments: StyledTextSegment[];
}
// attribute black list [readonly]
const attrBlackListRaw = [
  'absoluteBoundingBox',
  'absoluteRenderBounds',
  'absoluteTransform',
  'attachedConnectors',
  'backgrounds',
  'children',
  'componentPropertyDefinitions',
  'dashPattern',
  'documentationLinks',
  'effects',
  'exportSettings',
  'fills',
  'guides',
  'height',
  'id',
  'key',
  'layoutGrids',
  'overlayBackground',
  'overlayBackgroundInteraction',
  'overlayPositionType',
  'parent',
  'reactions',
  'remote',
  'removed',
  'strokes',
  'stuckNodes',
  'variantProperties',
  'width',
  'type',
  '_textSegments',
  'pointCount',
  'exportAsSvg',
  'strokeCap',
  'innerRadius',
] as const;

const attrBlackList = new Set<string>(attrBlackListRaw);

type ReadOnlySceneNodeFields = typeof attrBlackListRaw[number];
type WriteableSceneNodeKeys = keyof WriteableSceneNode;
type WriteableSceneNode = Omit<OmitMethods<SceneNode>, ReadOnlySceneNodeFields>;

export function resizeNode(node: SceneNode, nodeConfig: SceneNode) {
  if (supportsResize(node) && supportsResize(nodeConfig)) {
    if (node.type === 'LINE') {
      node.resize(nodeConfig.width || 0, nodeConfig.height || 0);
      return;
    }
    node.resize(nodeConfig.width, nodeConfig.height);
  }
}

export function setFills(node: SceneNode, nodeConfig: SceneNode) {
  if (supportsFills(node) && supportsFills(nodeConfig)) {
    if (nodeConfig.fills) {
      node.fills = nodeConfig.fills;
    } else {
      node.fills = [];
    }
  }
}

export function setStrokes(node: SceneNode, nodeConfig: SceneNode) {
  if (supportsStrokes(node) && supportsStrokes(nodeConfig)) {
    if (nodeConfig.strokes) {
      node.strokes = nodeConfig.strokes;
    }
  }
}

export function setEffects(node: SceneNode, nodeConfig: SceneNode) {
  if (supportsEffects(node) && supportsEffects(nodeConfig)) {
    if (nodeConfig.effects) {
      node.effects = nodeConfig.effects;
    }
  }
}

export function hydrateNewNode(newChild: SceneNode, childConfig: SceneNode) {
  for (const [attr, val] of Object.entries(childConfig)) {
    const attrTyped = attr as WriteableSceneNodeKeys;
    if (childConfig[attrTyped] && !attrBlackList.has(attr)) {
      (newChild as any)[attrTyped] = val;
    }
  }
}

export async function generateFrameNode(node: FrameNode) {
  const frame = figma.createFrame();
  resizeNode(frame, node);
  hydrateNewNode(frame, node);
  setFills(frame, node);
  setStrokes(frame, node);
  setEffects(frame, node);
  return frame;
}

export async function generateTextNode(node: textNode2) {
  await ensureFontIsLoaded({ family: 'Inter', style: 'Regular' });
  const text = figma.createText();
  hydrateNewNode(text, node);

  resizeNode(text, node);
  setFills(text, node);
  setStrokes(text, node);
  setEffects(text, node);
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

export async function generateRectancle(node: RectangleNode) {
  const rectangle = figma.createRectangle();
  hydrateNewNode(rectangle, node);

  resizeNode(rectangle, node);
  setFills(rectangle, node);
  setStrokes(rectangle, node);
  setEffects(rectangle, node);
  return rectangle;
}

export async function generateLineNode(node: LineNode) {
  const line = figma.createLine();
  hydrateNewNode(line, node);

  resizeNode(line, node);
  setFills(line, node);
  setStrokes(line, node);
  setEffects(line, node);
  return line;
}

export async function generateVectorNode(node: VectorNode, ctx: FigmaConfigContext) {
  const vector = figma.createNodeFromSvg(ctx.svgs[node.id]['svg']);

  hydrateNewNode(vector, node);
  vector.rotation = 0;
  setEffects(vector, node);
  return vector;
}
