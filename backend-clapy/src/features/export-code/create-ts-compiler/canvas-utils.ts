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
  | LineNode
  | EllipseNode
  | PolygonNode
  | StarNode
  | VectorNode2
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
export type TextNode2 = ExtendNodeType<TextNode, { _textSegments?: StyledTextSegment[] }>;
export type FrameNode2 = ExtendNodeType<FrameNode>;
export type ComponentNode2 = ExtendNodeType<ComponentNode>;
export type InstanceNode2 = ExtendNodeType<InstanceNode>;
export type RectangleNode2 = ExtendNodeType<RectangleNode>;
export type GroupNode2 = ExtendNodeType<GroupNode>;

export function isPage(node: BaseNode2 | PageNode2 | Nil): node is PageNode2 {
  return node?.type === 'PAGE';
}

export function isLayout(node: BaseNode2 | null | undefined): node is LayoutMixin & BaseNode2 {
  return !!node && layoutTypes.has(node.type);
}

export function isGroup(node: SceneNode2 | Nil): node is GroupNode2 {
  return node?.type === 'GROUP';
}

export function isSlice(node: SceneNode2 | Nil): node is SliceNode {
  return node?.type === 'SLICE';
}

export function isRectangle(node: SceneNode2 | Nil): node is RectangleNode2 {
  return node?.type === 'RECTANGLE';
}

export function isLine(node: SceneNode2 | Nil): node is LineNode {
  return node?.type === 'LINE';
}

export function isEllipse(node: SceneNode2 | Nil): node is EllipseNode {
  return node?.type === 'ELLIPSE';
}

export function isPolygon(node: SceneNode2 | Nil): node is PolygonNode {
  return node?.type === 'POLYGON';
}

export function isStar(node: SceneNode2 | Nil): node is StarNode {
  return node?.type === 'STAR';
}

export function isVector(node: SceneNode2 | Nil): node is VectorNode2 {
  return node?.type === 'VECTOR';
}

export function isText(node: SceneNode2 | Nil): node is TextNode2 {
  return node?.type === 'TEXT';
}

export function isBooleanOperation(node: SceneNode2 | Nil): node is BooleanOperationNode {
  return node?.type === 'BOOLEAN_OPERATION';
}

export function isStamp(node: SceneNode2 | Nil): node is StampNode {
  return node?.type === 'STAMP';
}

export function isComponentSet(node: SceneNode2 | Nil): node is ComponentSetNode {
  return node?.type === 'COMPONENT_SET';
}

export function isFrame(node: SceneNode2 | Nil /* BaseNode2 | BaseFrameMixin | undefined */): node is FrameNode2 {
  return (node as BaseNode2)?.type === 'FRAME';
}

export function isComponent(node: SceneNode2 | Nil): node is ComponentNode2 {
  return node?.type === 'COMPONENT';
}

export function isInstance(node: SceneNode2 | BaseNode2 | Nil): node is InstanceNode2 {
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

// ComponentSetNode is not included in FlexNode.
export type FlexNode = FrameNode2 | ComponentNode2 | InstanceNode2;
// GroupNode doesn't have auto-layout
export type BlockNode = FlexNode | RectangleNode2 | GroupNode2;
export type ValidNode = BlockNode | TextNode2 | VectorNode2;

export function isValidNode(node: SceneNode2 | Nil): node is ValidNode {
  return isBlockNode(node) || isText(node) || isVector(node);
}

export function isBlockNode(node: SceneNode2 | Nil): node is BlockNode {
  return isFlexNode(node) || isRectangle(node) || isGroup(node);
}

export function isFlexNode(node: SceneNode2 | Nil): node is FlexNode {
  return isFrame(node) || isComponent(node) || isInstance(node);
}

export function isStyledTextSegment(node: SceneNode2 | StyledTextSegment | Nil): node is StyledTextSegment {
  const sts = node as StyledTextSegment;
  return sts.characters != null && sts.start != null && sts.end != null;
}
