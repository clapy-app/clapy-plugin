import type { Nil } from '../../common/app-models';
import type { Intersect } from '../../common/sb-serialize.model';

export function getPageById(pageId: string) {
  return figma.getNodeById(pageId) as PageNode;
}

export function isPage(node: BaseNode | undefined): node is PageNode {
  return node?.type === 'PAGE';
}

const layoutTypes = new Set([
  'GROUP',
  'SLICE',
  'RECTANGLE',
  'ELLIPSE',
  'POLYGON',
  'STAR',
  'VECTOR',
  'TEXT',
  'BOOLEAN_OPERATION',
  'STAMP',
  'COMPONENT_SET',
  'FRAME',
  'COMPONENT',
  'INSTANCE',
]);

export type LayoutNode =
  | GroupNode
  | SliceNode
  | RectangleNode
  | LineNode
  | EllipseNode
  | PolygonNode
  | StarNode
  | VectorNode
  | TextNode
  | BooleanOperationNode
  | StampNode
  | ComponentSetNode
  | FrameNode
  | ComponentNode
  | InstanceNode;

type LayoutNodeExtended =
  | LayoutNode
  // Types I'm not sure it's part of the layout (LayoutMixin), but causing typescript errors otherwise:
  | StickyNode
  | ConnectorNode
  | ShapeWithTextNode
  | CodeBlockNode
  | WidgetNode
  | EmbedNode
  | LinkUnfurlNode
  | MediaNode;

// clone() method available on nodes: Page, frame, group, slice, rectangle, line, ellipse, polygon, star, vector, text, componentSet, component, instance, BooleanOperationNode, sticky, stamp, ShapeWithText, CodeBlockNode, Connector, Widget, Embed, LinkUnfurl, Media
// Let's approximate with Layout.

export function isLayout(node: BaseNode | null | undefined): node is LayoutMixin & BaseNode {
  return !!node && layoutTypes.has(node.type);
}

export function isGroup(node: BaseNode | SceneNode | Nil): node is GroupNode {
  return node?.type === 'GROUP';
}

export function isSlice(node: BaseNode | SceneNode | Nil): node is SliceNode {
  return node?.type === 'SLICE';
}

export function isRectangle(node: BaseNode | SceneNode | Nil): node is RectangleNode {
  return node?.type === 'RECTANGLE';
}

export function isLine(node: BaseNode | SceneNode | Nil): node is LineNode {
  return node?.type === 'LINE';
}

export function isEllipse(node: BaseNode | SceneNode | Nil): node is EllipseNode {
  return node?.type === 'ELLIPSE';
}

export function isPolygon(node: BaseNode | SceneNode | Nil): node is PolygonNode {
  return node?.type === 'POLYGON';
}

export function isStar(node: BaseNode | SceneNode | Nil): node is StarNode {
  return node?.type === 'STAR';
}

export function isVector(node: BaseNode | SceneNode | Nil): node is VectorNode {
  return node?.type === 'VECTOR';
}

export function isText(node: BaseNode | SceneNode | Nil): node is TextNode {
  return node?.type === 'TEXT';
}

export function isBooleanOperation(node: BaseNode | SceneNode | Nil): node is BooleanOperationNode {
  return node?.type === 'BOOLEAN_OPERATION';
}

export function isStamp(node: BaseNode | SceneNode | Nil): node is StampNode {
  return node?.type === 'STAMP';
}

export function isComponentSet(node: BaseNode | SceneNode | Nil): node is ComponentSetNode {
  return node?.type === 'COMPONENT_SET';
}

export function isFrame(
  node: BaseNode | SceneNode | Nil /* BaseNode | BaseFrameMixin | undefined */,
): node is FrameNode {
  return (node as BaseNode)?.type === 'FRAME';
}

export function isComponent(node: BaseNode | SceneNode | Nil): node is ComponentNode {
  return node?.type === 'COMPONENT';
}

export function isInstance(node: BaseNode | SceneNode | BaseNode | Nil): node is InstanceNode {
  return node?.type === 'INSTANCE';
}

export function isBaseFrameMixin(node: BaseNode | BaseFrameMixin | Nil): node is BaseFrameMixin {
  return !!(node as BaseFrameMixin)?.layoutMode;
}

export function isChildrenMixin(node: BaseNode | ChildrenMixin | Nil): node is ChildrenMixin {
  return !!(node as ChildrenMixin)?.children;
}

export function isMinimalStrokesMixin(node: BaseNode | MinimalStrokesMixin | Nil): node is MinimalStrokesMixin {
  return !!(node as MinimalStrokesMixin)?.strokeAlign;
}

export function isMinimalFillsMixin(node: BaseNode | MinimalFillsMixin | Nil): node is MinimalFillsMixin {
  return !!(node as MinimalFillsMixin)?.fills;
}

// Has isMask property
export function isBlendMixin(node: BaseNode | BlendMixin | Nil): node is BlendMixin {
  return !!(node as BlendMixin)?.blendMode;
}

export function isExportMixin(node: BaseNode | ExportMixin | Nil): node is ExportMixin {
  return !!(node as ExportMixin)?.exportAsync;
}

export type WithChildrenNode = Intersect<SceneNode, ChildrenMixin>;

export type MyCompNode = ComponentNode | ComponentSetNode | FrameNode;

export function isMyComp(node: BaseNode | SceneNode | Nil): node is MyCompNode {
  return isFrame(node) || isComponentSet(node) || isComponent(node);
}

export type ShapeNode = LineNode | EllipseNode | PolygonNode | StarNode | VectorNode | BooleanOperationNode;

export function isShapeExceptDivable(node: BaseNode | SceneNode | Nil): node is ShapeNode {
  // Rectangle and line are excluded
  return (
    isEllipse(node) ||
    isPolygon(node) ||
    isStar(node) ||
    isVector(node) ||
    isBooleanOperation(node) ||
    (isFrame(node) && node.isMask)
  );
}

export function isStyledTextSegment(
  node: SceneNode | StyledTextSegment | PageNode | DocumentNode | Nil,
): node is StyledTextSegment {
  const sts = node as StyledTextSegment;
  return sts.characters != null && sts.start != null && sts.end != null;
}
