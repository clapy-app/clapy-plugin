/* eslint-disable prettier/prettier */
//-------------------------------------------------------------------------------------------------------------
//-------------------------------child Node generation functions implementation--------------------------------

import type { OmitMethods} from '../../../common/sb-serialize.model.js';
import { ensureFontIsLoaded } from './utils.js';

//-------------------------------------------------------------------------------------------------------------
interface textNode2 extends TextNode {
  _textSegments: StyledTextSegment[];
}
// attribute black list [readonly]
const attrBlackListRaw = ['absoluteBoundingBox',
'absoluteRenderBounds',
'absoluteTransform',
"attachedConnectors",
"backgrounds",
"children",
"componentPropertyDefinitions",
"dashPattern",
"documentationLinks",
"effects",
"exportSettings",
"fills",
"guides",
"height",
"id",
"key",
"layoutGrids",
"overlayBackground",
"overlayBackgroundInteraction",
"overlayPositionType",
"parent",
"reactions",
"remote",
"removed",
"strokes",
"stuckNodes",
"variantProperties",
"width",
"type",
"_textSegments"
] as const;

const attrBlackList = new Set<string>(attrBlackListRaw)

type ReadOnlySceneNodeFields = typeof attrBlackListRaw[number]
type WriteableSceneNodeKeys = keyof WriteableSceneNode

type NonResizableNodes = StickyNode | ConnectorNode | CodeBlockNode | WidgetNode | EmbedNode | LinkUnfurlNode | SectionNode
type NonFillNodes = SliceNode | GroupNode| ConnectorNode | CodeBlockNode | WidgetNode | EmbedNode | LinkUnfurlNode | MediaNode
type NonStrokeNodes = SliceNode | GroupNode | StickyNode | CodeBlockNode | WidgetNode | EmbedNode | LinkUnfurlNode | MediaNode | SectionNode
type NonEffectsNodes = StickyNode | SliceNode | ConnectorNode | ShapeWithTextNode | CodeBlockNode | WidgetNode | EmbedNode | LinkUnfurlNode | MediaNode | SectionNode

type WriteableSceneNode =Omit<OmitMethods<SceneNode>, ReadOnlySceneNodeFields>
type SceneNodeResizable = Exclude<SceneNode,NonResizableNodes>
type NodesWithFillsProperty =Exclude<SceneNode,NonFillNodes>
type NodesWithStrokesProperty = Exclude<SceneNode, NonStrokeNodes>
type NodesWithEffectsProprety = Exclude<SceneNode,NonEffectsNodes>


export function resizeNode(node:SceneNodeResizable,nodeConfig:SceneNodeResizable) {
  node.resize(nodeConfig.width,nodeConfig.height)
}

export function setFills(node:NodesWithFillsProperty, nodeConfig:NodesWithFillsProperty) {
  if (nodeConfig.fills) {
    node.fills = nodeConfig.fills;
  } else {
    node.fills = [];
  }
}
export function setStrokes(node:NodesWithStrokesProperty,nodeConfig:NodesWithStrokesProperty) {
  if (nodeConfig.strokes) {
    node.strokes = nodeConfig.strokes;
  }
}
 export function setEffects(node: NodesWithEffectsProprety, nodeConfig:NodesWithEffectsProprety) {
  if (nodeConfig) {
    node.effects = nodeConfig.effects;
  }
 }
export function hydrateNewNode(newChild: SceneNode, childConfig: SceneNode,) {
  for (const [attr, val] of Object.entries(childConfig)) {
    const attrTyped = attr as WriteableSceneNodeKeys;
    if (childConfig[attrTyped] && !attrBlackList.has(attr) ) {
      (newChild as any)[attrTyped] = val;
    }
  }
}

export async function generateFrameNode(node:  FrameNode) {
  const frame = figma.createFrame();
  resizeNode(frame,node);
  hydrateNewNode(frame, node);
  setFills(frame,node);
  setStrokes(frame,node);
  setEffects(frame,node);
  return frame;
}

export async function generateTextNode(node: textNode2) {
  let text;
  await ensureFontIsLoaded({ family: 'Inter', style: 'Regular' });
  text = figma.createText();
  hydrateNewNode(text, node);
  resizeNode(text,node);
  setFills(text,node);
  setStrokes(text,node);
  setEffects(text,node);
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
  let rectangle;
  rectangle = figma.createRectangle();
  resizeNode(rectangle,node);
  hydrateNewNode(rectangle ,node);
  setFills(rectangle,node);
  setStrokes(rectangle,node);
  setEffects(rectangle,node);
  return rectangle;
}
