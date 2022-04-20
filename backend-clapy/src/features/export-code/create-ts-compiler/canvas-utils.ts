import { Nil } from '../../../common/general-utils';
import { FrameNodeBlackList, OmitMethods } from '../../sb-serialize-preview/sb-serialize.model';

export function getPageById(pageId: string) {
  return figma.getNodeById(pageId) as PageNode;
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
  | GroupNode2
  | SliceNode
  | RectangleNode2
  | LineNode2
  | EllipseNode
  | PolygonNode
  | StarNode
  | VectorNodeDerived
  | TextNode2
  | BooleanOperationNode
  | StampNode
  | ComponentSetNode
  | FrameNode2
  | ComponentNode2
  | InstanceNode2;

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

export interface Masker {
  url: string;
  width: number;
  height: number;
  x: number;
  y: number;
}

type ExtendNodeType<Node, SpecificExtender = {}> = Omit<OmitMethods<Node>, Exclude<FrameNodeBlackList, 'children'>> &
  GlobalExtender &
  SpecificExtender;

interface GlobalExtender {
  maskedBy?: Masker;
  skip?: boolean;
}

// Incomplete typings. Complete by adding other node types when needed.
export type BaseNode2 = ExtendNodeType<BaseNode>;
export type PageNode2 = ExtendNodeType<PageNode>;
export type SceneNode2 = ExtendNodeType<SceneNode>;
export type VectorNode2 = ExtendNodeType<VectorNode, { _svg?: string }>;
export type VectorNodeDerived = ExtendNodeType<VectorNode | BooleanOperationNode, { _svg?: string }>;
export type TextNode2 = ExtendNodeType<TextNode, { _textSegments?: StyledTextSegment[] }>;
export type FrameNode2 = ExtendNodeType<FrameNode>;
export type ComponentNode2 = ExtendNodeType<ComponentNode>;
export type InstanceNode2 = ExtendNodeType<InstanceNode>;
export type RectangleNode2 = ExtendNodeType<RectangleNode>;
export type GroupNode2 = ExtendNodeType<GroupNode>;
export type LineNode2 = ExtendNodeType<LineNode>;
export type BooleanOperationNode2 = ExtendNodeType<BooleanOperationNode>;

export function isPage(node: BaseNode2 | PageNode2 | Nil): node is PageNode2 {
  return node?.type === 'PAGE';
}

export function isLayout(node: BaseNode2 | SceneNode2 | null | undefined): node is LayoutMixin & BaseNode2 {
  return !!node && layoutTypes.has(node.type);
}

export function isGroup(node: BaseNode2 | SceneNode2 | Nil): node is GroupNode2 | BooleanOperationNode2 {
  return node?.type === 'GROUP' || node?.type === 'BOOLEAN_OPERATION';
  // The added BooleanOperationNode is to pay attention to the typing. But anyway, they are likely to be in a SVG (see VectorNodeDerived).
}

export function isSlice(node: BaseNode2 | SceneNode2 | Nil): node is SliceNode {
  return node?.type === 'SLICE';
}

export function isRectangle(node: BaseNode2 | SceneNode2 | Nil): node is RectangleNode2 {
  return node?.type === 'RECTANGLE';
}

export function isLine(node: BaseNode2 | SceneNode2 | Nil): node is LineNode2 {
  return node?.type === 'LINE';
}

export function isEllipse(node: BaseNode2 | SceneNode2 | Nil): node is EllipseNode {
  return node?.type === 'ELLIPSE';
}

export function isPolygon(node: BaseNode2 | SceneNode2 | Nil): node is PolygonNode {
  return node?.type === 'POLYGON';
}

export function isStar(node: BaseNode2 | SceneNode2 | Nil): node is StarNode {
  return node?.type === 'STAR';
}

export function isVector(node: BaseNode2 | SceneNode2 | Nil): node is VectorNodeDerived {
  // Patch because BooleanOp are very likely to be converted into vectors. Vectors can be from BooleanOp, so we should ensure we only use available properties, or we need to be more specific.
  return node?.type === 'VECTOR';
}

export function isText(node: BaseNode2 | SceneNode2 | Nil): node is TextNode2 {
  return node?.type === 'TEXT';
}

export function isBooleanOperation(node: BaseNode2 | SceneNode2 | Nil): node is BooleanOperationNode2 {
  return node?.type === 'BOOLEAN_OPERATION';
}

export function isStamp(node: BaseNode2 | SceneNode2 | Nil): node is StampNode {
  return node?.type === 'STAMP';
}

export function isComponentSet(node: BaseNode2 | SceneNode2 | Nil): node is ComponentSetNode {
  return node?.type === 'COMPONENT_SET';
}

export function isFrame(node: BaseNode2 | SceneNode2 | Nil): node is FrameNode2 {
  return (node as BaseNode2)?.type === 'FRAME';
}

export function isComponent(node: BaseNode2 | SceneNode2 | Nil): node is ComponentNode2 {
  return node?.type === 'COMPONENT';
}

export function isInstance(node: BaseNode2 | SceneNode2 | Nil): node is InstanceNode2 {
  return node?.type === 'INSTANCE';
}

export function isBaseFrameMixin(node: BaseNode2 | BaseFrameMixin | Nil): node is BaseFrameMixin {
  return !!(node as BaseFrameMixin)?.layoutMode;
}

export interface ChildrenMixin2 {
  readonly children: ReadonlyArray<SceneNode2>;
}

export function isChildrenMixin(node: BaseNode2 | ChildrenMixin2 | Nil): node is ChildrenMixin2 {
  return !!(node as ChildrenMixin2)?.children;
}

// Has isMask property
export function isBlendMixin(node: BaseNode2 | BlendMixin | Nil): node is BlendMixin {
  return !!(node as BlendMixin)?.blendMode;
}

export function isConstraintMixin(node: BaseNode2 | ConstraintMixin | Nil): node is ConstraintMixin {
  return !!(node as ConstraintMixin)?.constraints;
}

export function isStyledTextSegment(node: BaseNode2 | SceneNode2 | StyledTextSegment | Nil): node is StyledTextSegment {
  const sts = node as StyledTextSegment;
  return sts.characters != null && sts.start != null && sts.end != null;
}

// ComponentSetNode is not included in FlexNode.
export type FlexNode = FrameNode2 | ComponentNode2 | InstanceNode2;

export function isFlexNode(node: BaseNode2 | SceneNode2 | Nil): node is FlexNode {
  return isFrame(node) || isComponent(node) || isInstance(node);
}

// GroupNode doesn't have auto-layout
export type BlockNode = FlexNode | RectangleNode2 | GroupNode2 | BooleanOperationNode2 | LineNode2;

export function isBlockNode(node: BaseNode2 | SceneNode2 | Nil): node is BlockNode {
  return isFlexNode(node) || isRectangle(node) || isGroup(node) || isBooleanOperation(node) || isLine(node);
}

export type ValidNode = BlockNode | TextNode2 | VectorNodeDerived;

export function isValidNode(node: BaseNode2 | SceneNode2 | Nil): node is ValidNode {
  return isBlockNode(node) || isText(node) || isVector(node);
}
