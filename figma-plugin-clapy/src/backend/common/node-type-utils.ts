import type { Nil } from '../../common/app-models';
import type {
  BaseNode2,
  BooleanOperationNode2,
  ChildrenMixin2,
  ComponentNode2,
  ComponentSetNode2,
  EllipseNode2,
  FrameNode2,
  GroupNode2,
  InstanceNode2,
  Intersect,
  LayoutMixin2,
  LineNode2,
  PageNode2,
  PolygonNode2,
  RectangleNode2,
  SceneNode2,
  StarNode2,
  TextNode2,
  VectorNode2,
} from '../../common/sb-serialize.model';
import type { AnyNode3 } from '../routes/5-export-code/read-figma-config-utils.js';

export function getPageById(pageId: string) {
  return figma.getNodeById(pageId) as PageNode;
}

export function isPage(node: BaseNode2 | undefined): node is PageNode {
  return node?.type === 'PAGE';
}

export function isPage2(node: BaseNode2 | undefined): node is PageNode2 {
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

export function isLayout0(node: BaseNode | null | undefined): node is LayoutMixin & BaseNode {
  return !!node && layoutTypes.has(node.type);
}

export function isLayout(node: BaseNode2 | null | undefined): node is LayoutMixin & BaseNode2 {
  return !!node && layoutTypes.has(node.type);
}

export function isLayout2(node: BaseNode2 | null | undefined): node is LayoutMixin2 & BaseNode2 {
  return !!node && layoutTypes.has(node.type);
}

export function isGroup0(type: string): boolean {
  return type === 'GROUP';
}

export function isGroup(node: BaseNode2 | SceneNode2 | Nil): node is GroupNode {
  return node?.type === 'GROUP';
}

export function isGroup2(node: BaseNode2 | SceneNode2 | Nil): node is GroupNode2 {
  return node?.type === 'GROUP';
}

export function isSlice(node: BaseNode2 | SceneNode2 | Nil): node is SliceNode {
  return node?.type === 'SLICE';
}

export function isRectangle0(type: string): boolean {
  return type === 'RECTANGLE';
}

export function isRectangle(node: BaseNode2 | SceneNode2 | Nil): node is RectangleNode {
  return node?.type === 'RECTANGLE';
}

export function isRectangle2(node: BaseNode2 | SceneNode2 | Nil): node is RectangleNode2 {
  return node?.type === 'RECTANGLE';
}

export function isLine0(type: string): boolean {
  return type === 'LINE';
}

export function isLine(node: BaseNode2 | SceneNode2 | Nil): node is LineNode {
  return node?.type === 'LINE';
}

export function isEllipse0(type: string): boolean {
  return type === 'ELLIPSE';
}

export function isEllipse(node: BaseNode2 | SceneNode2 | Nil): node is EllipseNode {
  return node?.type === 'ELLIPSE';
}

export function isEllipse2(node: BaseNode2 | SceneNode2 | Nil): node is EllipseNode2 {
  return node?.type === 'ELLIPSE';
}

export function isPolygon0(type: string): boolean {
  return type === 'POLYGON';
}

export function isPolygon(node: BaseNode2 | SceneNode2 | Nil): node is PolygonNode {
  return node?.type === 'POLYGON';
}

export function isPolygon2(node: BaseNode2 | SceneNode2 | Nil): node is PolygonNode2 {
  return node?.type === 'POLYGON';
}

export function isStar0(type: string): boolean {
  return type === 'STAR';
}

export function isStar(node: BaseNode2 | SceneNode2 | Nil): node is StarNode {
  return node?.type === 'STAR';
}

export function isStar2(node: BaseNode2 | SceneNode2 | Nil): node is StarNode2 {
  return node?.type === 'STAR';
}

export function isVector0(type: string): boolean {
  return type === 'VECTOR';
}

export function isVector(node: BaseNode2 | SceneNode2 | Nil): node is VectorNode {
  return node?.type === 'VECTOR';
}

export function isVector2(node: BaseNode2 | SceneNode2 | Nil): node is VectorNode2 {
  return node?.type === 'VECTOR';
}

export function isText(node: BaseNode2 | SceneNode2 | Nil): node is TextNode {
  return node?.type === 'TEXT';
}

export function isText2(node: BaseNode2 | SceneNode2 | Nil): node is TextNode2 {
  return node?.type === 'TEXT';
}

export function isBooleanOperation0(type: string): boolean {
  return type === 'BOOLEAN_OPERATION';
}

export function isBooleanOperation(node: BaseNode2 | SceneNode2 | Nil): node is BooleanOperationNode {
  return node?.type === 'BOOLEAN_OPERATION';
}

export function isBooleanOperation2(node: BaseNode2 | SceneNode2 | Nil): node is BooleanOperationNode2 {
  return node?.type === 'BOOLEAN_OPERATION';
}

export function isStamp(node: BaseNode2 | SceneNode2 | Nil): node is StampNode {
  return node?.type === 'STAMP';
}

export function isComponentSet(node: BaseNode2 | SceneNode2 | Nil): node is ComponentSetNode {
  return node?.type === 'COMPONENT_SET';
}

export function isComponentSet2(node: BaseNode2 | SceneNode2 | Nil): node is ComponentSetNode2 {
  return node?.type === 'COMPONENT_SET';
}

export function isFrame0(type: string): boolean {
  return type === 'FRAME';
}

export function isFrame(
  node: BaseNode2 | SceneNode2 | Nil /* BaseNode2 | BaseFrameMixin | undefined */,
): node is FrameNode {
  return (node as BaseNode)?.type === 'FRAME';
}

export function isFrame2(node: BaseNode2 | SceneNode2 | Nil): node is FrameNode2 {
  return (node as BaseNode2)?.type === 'FRAME';
}

export function isComponent(node: BaseNode2 | SceneNode2 | PageNode2 | Nil): node is ComponentNode {
  return node?.type === 'COMPONENT';
}

export function isComponent2(node: BaseNode2 | SceneNode2 | PageNode2 | Nil): node is ComponentNode2 {
  return node?.type === 'COMPONENT';
}

export function isInstance(node: BaseNode2 | SceneNode2 | Nil): node is InstanceNode {
  return node?.type === 'INSTANCE';
}

export function isInstance2(node: BaseNode2 | SceneNode2 | Nil): node is InstanceNode2 {
  return node?.type === 'INSTANCE';
}

export function isBaseFrameMixin(node: BaseNode2 | BaseFrameMixin | Nil): node is BaseFrameMixin {
  return !!(node as BaseFrameMixin)?.layoutMode;
}

export function isChildrenMixin(node: BaseNode | ChildrenMixin | Nil): node is ChildrenMixin {
  return !!(node as ChildrenMixin)?.children;
}

export function isChildrenMixin2(node: BaseNode2 | ChildrenMixin2 | Nil): node is ChildrenMixin2 {
  return !!(node as ChildrenMixin2)?.children;
}

export function isMinimalStrokesMixin(node: BaseNode2 | MinimalStrokesMixin | Nil): node is MinimalStrokesMixin {
  return !!(node as MinimalStrokesMixin)?.strokeAlign;
}

export function isMinimalFillsMixin(node: BaseNode2 | MinimalFillsMixin | Nil): node is MinimalFillsMixin {
  return !!(node as MinimalFillsMixin)?.fills;
}

// Has isMask property
export function isBlendMixin(node: BaseNode2 | BlendMixin | Nil): node is BlendMixin {
  return !!(node as BlendMixin)?.blendMode;
}

export function isExportMixin(node: BaseNode2 | ExportMixin | Nil): node is ExportMixin {
  return !!(node as ExportMixin)?.exportAsync;
}

export type WithChildrenNode = Intersect<SceneNode, ChildrenMixin>;

export type MyCompNode = ComponentNode | ComponentSetNode | FrameNode;

export function isMyComp(node: BaseNode2 | SceneNode2 | Nil): node is MyCompNode {
  return isFrame(node) || isComponentSet(node) || isComponent(node);
}

export type ShapeNode = LineNode | EllipseNode | PolygonNode | StarNode | VectorNode | BooleanOperationNode;

export function isShapeExceptDivable(type: string, isMask: boolean): boolean {
  // Rectangle and line are excluded
  return (
    isEllipse0(type) ||
    isPolygon0(type) ||
    isStar0(type) ||
    isVector0(type) ||
    isBooleanOperation0(type) ||
    (isFrame0(type) && isMask)
  );
}

export type ShapeNode2 = LineNode2 | EllipseNode2 | PolygonNode2 | StarNode2 | VectorNode2 | BooleanOperationNode2;

export function isShapeExceptDivable2(node: BaseNode2 | SceneNode2 | Nil): node is ShapeNode2 {
  // Rectangle and line are excluded
  return (
    isEllipse2(node) ||
    isPolygon2(node) ||
    isStar2(node) ||
    isVector2(node) ||
    isBooleanOperation2(node) ||
    (isFrame2(node) && node.isMask)
  );
}

export function isStyledTextSegment(
  node: SceneNode | PageNode | SceneNode2 | StyledTextSegment | PageNode2 | DocumentNode | AnyNode3 | Nil,
): node is StyledTextSegment {
  const sts = node as StyledTextSegment;
  return sts.characters != null && sts.start != null && sts.end != null;
}

export function isEmptyFrame(
  type: string,
  fills: ReadonlyArray<Paint> | undefined,
  strokes: ReadonlyArray<Paint> | undefined,
  effects: ReadonlyArray<Effect> | undefined,
): boolean {
  return (
    isFrame0(type) &&
    (!Array.isArray(fills) || (fills as Paint[]).every(fill => !fill.visible)) &&
    (!Array.isArray(strokes) || (strokes as Paint[]).every(stroke => !stroke.visible)) &&
    (!Array.isArray(effects) || (effects as Effect[]).every(effect => !effect.visible))
  );
}
