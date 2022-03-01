import { Nil } from '../../../common/app-models';
import { Intersect } from './sb-serialize.model';

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
  | InstanceNode
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

export function isGroup(node: LayoutNode | Nil): node is GroupNode {
  return node?.type === 'GROUP';
}

export function isSlice(node: LayoutNode | Nil): node is SliceNode {
  return node?.type === 'SLICE';
}

export function isRectangle(node: LayoutNode | Nil): node is RectangleNode {
  return node?.type === 'RECTANGLE';
}

export function isLine(node: LayoutNode | Nil): node is LineNode {
  return node?.type === 'LINE';
}

export function isEllipse(node: LayoutNode | Nil): node is EllipseNode {
  return node?.type === 'ELLIPSE';
}

export function isPolygon(node: LayoutNode | Nil): node is PolygonNode {
  return node?.type === 'POLYGON';
}

export function isStar(node: LayoutNode | Nil): node is StarNode {
  return node?.type === 'STAR';
}

export function isVector(node: LayoutNode | Nil): node is VectorNode {
  return node?.type === 'VECTOR';
}

export function isText(node: LayoutNode | Nil): node is TextNode {
  return node?.type === 'TEXT';
}

export function isBooleanOperation(node: LayoutNode | Nil): node is BooleanOperationNode {
  return node?.type === 'BOOLEAN_OPERATION';
}

export function isStamp(node: LayoutNode | Nil): node is StampNode {
  return node?.type === 'STAMP';
}

export function isComponentSet(node: LayoutNode | Nil): node is ComponentSetNode {
  return node?.type === 'COMPONENT_SET';
}

export function isFrame(node: LayoutNode | Nil /* BaseNode | BaseFrameMixin | undefined */): node is FrameNode {
  return (node as BaseNode)?.type === 'FRAME';
}

export function isComponent(node: LayoutNode | Nil): node is ComponentNode {
  return node?.type === 'COMPONENT';
}

export function isInstance(node: LayoutNode | Nil): node is InstanceNode {
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
