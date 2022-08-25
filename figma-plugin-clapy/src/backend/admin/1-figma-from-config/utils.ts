//-------------------------------------------------------------------------------------------------------------
//-------------------------------utils functions implementation--------------------------------

import type { Dict, OmitMethods } from '../../../common/sb-serialize.model.js';

//-------------------------------------------------------------------------------------------------------------
const loadedFonts = new Map<string, Promise<void>>();

interface Svg {
  svg: string;
  name: string;
}

type Svgs = Dict<Svg>;

export interface FigmaConfigContext {
  svgs: Svgs;
}

export interface textNode2 extends TextNode {
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

export const attrBlackList = new Set<string>(attrBlackListRaw);

type ReadOnlySceneNodeFields = typeof attrBlackListRaw[number];
type WriteableSceneNode = Omit<OmitMethods<SceneNode>, ReadOnlySceneNodeFields>;
export type WriteableSceneNodeKeys = keyof WriteableSceneNode;

export async function ensureFontIsLoaded(font: FontName) {
  const fontCacheKey = `${font.family}_${font.style}`;
  if (!loadedFonts.has(fontCacheKey)) {
    const p = figma.loadFontAsync(font);
    loadedFonts.set(fontCacheKey, p);
    // Loading fonts takes time. We are in a loop and we don't want other loop runs to also load the font. So the cache returns the promise of the font we are already loading, so that everybody awaits a shared font loading.
    await p;
  } else {
    await loadedFonts.get(fontCacheKey);
  }
}

export function cleanUpLastLaunch() {
  for (const page of figma.root.children) {
    if (page.id !== figma.currentPage.id) {
      page.remove();
    }
  }
}

export function supportsFills(
  node: SceneNode,
): node is
  | StickyNode
  | SectionNode
  | FrameNode
  | ComponentSetNode
  | ComponentNode
  | InstanceNode
  | BooleanOperationNode
  | VectorNode
  | StarNode
  | LineNode
  | EllipseNode
  | PolygonNode
  | RectangleNode
  | TextNode
  | ShapeWithTextNode
  | StampNode
  | HighlightNode
  | WashiTapeNode {
  const type = node.type;
  return (
    node.type === 'STICKY' ||
    node.type == 'SECTION' ||
    type === 'FRAME' ||
    type === 'COMPONENT' ||
    type === 'COMPONENT_SET' ||
    type === 'INSTANCE' ||
    type === 'BOOLEAN_OPERATION' ||
    type === 'VECTOR' ||
    type === 'STAR' ||
    type === 'LINE' ||
    type === 'ELLIPSE' ||
    type === 'POLYGON' ||
    type === 'RECTANGLE' ||
    type === 'TEXT' ||
    type === 'SHAPE_WITH_TEXT' ||
    type === 'STAMP' ||
    type === 'HIGHLIGHT' ||
    type === 'WASHI_TAPE'
  );
}

export function supportsStrokes(
  node: SceneNode,
): node is
  | TextNode
  | FrameNode
  | ComponentSetNode
  | ComponentNode
  | InstanceNode
  | BooleanOperationNode
  | VectorNode
  | StarNode
  | LineNode
  | EllipseNode
  | PolygonNode
  | RectangleNode
  | ConnectorNode
  | ShapeWithTextNode
  | StampNode
  | HighlightNode
  | WashiTapeNode {
  const type = node.type;
  return (
    type === 'TEXT' ||
    type === 'FRAME' ||
    type === 'COMPONENT' ||
    type === 'COMPONENT_SET' ||
    type === 'INSTANCE' ||
    type === 'BOOLEAN_OPERATION' ||
    type === 'VECTOR' ||
    type === 'STAR' ||
    type === 'LINE' ||
    type === 'ELLIPSE' ||
    type === 'POLYGON' ||
    type === 'RECTANGLE' ||
    type === 'CONNECTOR' ||
    type === 'SHAPE_WITH_TEXT' ||
    type === 'STAMP' ||
    type === 'HIGHLIGHT' ||
    type === 'WASHI_TAPE'
  );
}

export function supportsEffects(
  node: SceneNode,
): node is
  | FrameNode
  | GroupNode
  | ComponentSetNode
  | ComponentNode
  | InstanceNode
  | BooleanOperationNode
  | VectorNode
  | StarNode
  | LineNode
  | EllipseNode
  | PolygonNode
  | RectangleNode
  | TextNode
  | StampNode
  | HighlightNode
  | WashiTapeNode {
  const type = node.type;
  return (
    type === 'FRAME' ||
    type === 'GROUP' ||
    type === 'COMPONENT' ||
    type === 'COMPONENT_SET' ||
    type === 'INSTANCE' ||
    type === 'BOOLEAN_OPERATION' ||
    type === 'VECTOR' ||
    type === 'STAR' ||
    type === 'LINE' ||
    type === 'ELLIPSE' ||
    type === 'POLYGON' ||
    type === 'RECTANGLE' ||
    type === 'TEXT' ||
    type === 'STAMP' ||
    type === 'HIGHLIGHT' ||
    type === 'WASHI_TAPE'
  );
}

export function supportsResize(
  node: SceneNode,
): node is
  | SliceNode
  | FrameNode
  | GroupNode
  | ComponentSetNode
  | ComponentNode
  | InstanceNode
  | BooleanOperationNode
  | VectorNode
  | StarNode
  | LineNode
  | EllipseNode
  | PolygonNode
  | RectangleNode
  | TextNode
  | ShapeWithTextNode
  | StampNode
  | MediaNode
  | HighlightNode
  | WashiTapeNode {
  const type = node.type;
  return (
    type === 'SLICE' ||
    type === 'FRAME' ||
    type === 'GROUP' ||
    type === 'COMPONENT' ||
    type === 'COMPONENT_SET' ||
    type === 'INSTANCE' ||
    type === 'BOOLEAN_OPERATION' ||
    type === 'VECTOR' ||
    type === 'STAR' ||
    type === 'LINE' ||
    type === 'ELLIPSE' ||
    type === 'POLYGON' ||
    type === 'RECTANGLE' ||
    type === 'TEXT' ||
    type === 'SHAPE_WITH_TEXT' ||
    type === 'STAMP' ||
    type === 'MEDIA' ||
    type === 'HIGHLIGHT' ||
    type === 'WASHI_TAPE'
  );
}
