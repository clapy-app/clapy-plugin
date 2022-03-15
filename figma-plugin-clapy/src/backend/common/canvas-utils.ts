import { Nil } from '../../common/app-models';
import { Intersect } from '../../common/sb-serialize.model';

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
  | LinkUnfurlNode;

export function isLayout(node: BaseNode | null | undefined): node is LayoutMixin & BaseNode {
  return !!node && layoutTypes.has(node.type);
}

export function isGroup(node: LayoutNodeExtended | Nil): node is GroupNode {
  return node?.type === 'GROUP';
}

export function isSlice(node: LayoutNodeExtended | Nil): node is SliceNode {
  return node?.type === 'SLICE';
}

export function isRectangle(node: LayoutNodeExtended | Nil): node is RectangleNode {
  return node?.type === 'RECTANGLE';
}

export function isLine(node: LayoutNodeExtended | Nil): node is LineNode {
  return node?.type === 'LINE';
}

export function isEllipse(node: LayoutNodeExtended | Nil): node is EllipseNode {
  return node?.type === 'ELLIPSE';
}

export function isPolygon(node: LayoutNodeExtended | Nil): node is PolygonNode {
  return node?.type === 'POLYGON';
}

export function isStar(node: LayoutNodeExtended | Nil): node is StarNode {
  return node?.type === 'STAR';
}

export function isVector(node: LayoutNodeExtended | Nil): node is VectorNode {
  return node?.type === 'VECTOR';
}

export function isText(node: LayoutNodeExtended | Nil): node is TextNode {
  return node?.type === 'TEXT';
}

export function isBooleanOperation(node: LayoutNodeExtended | Nil): node is BooleanOperationNode {
  return node?.type === 'BOOLEAN_OPERATION';
}

export function isStamp(node: LayoutNodeExtended | Nil): node is StampNode {
  return node?.type === 'STAMP';
}

export function isComponentSet(node: LayoutNodeExtended | Nil): node is ComponentSetNode {
  return node?.type === 'COMPONENT_SET';
}

export function isFrame(node: LayoutNodeExtended | Nil /* BaseNode | BaseFrameMixin | undefined */): node is FrameNode {
  return (node as BaseNode)?.type === 'FRAME';
}

export function isComponent(node: LayoutNodeExtended | Nil): node is ComponentNode {
  return node?.type === 'COMPONENT';
}

export function isInstance(node: LayoutNodeExtended | Nil): node is InstanceNode {
  return node?.type === 'INSTANCE';
}

export function isBaseFrameMixin(node: BaseNode | BaseFrameMixin | Nil): node is BaseFrameMixin {
  return !!(node as BaseFrameMixin)?.layoutMode;
}

export function isChildrenMixin(node: BaseNode | ChildrenMixin | Nil): node is ChildrenMixin {
  return !!(node as ChildrenMixin)?.children;
}

export type WithChildrenNode = Intersect<SceneNode, ChildrenMixin>;

export type MyCompNode = ComponentNode | ComponentSetNode | FrameNode;

export function isMyComp(node: LayoutNodeExtended | Nil): node is MyCompNode {
  return isFrame(node) || isComponentSet(node) || isComponent(node);
}
