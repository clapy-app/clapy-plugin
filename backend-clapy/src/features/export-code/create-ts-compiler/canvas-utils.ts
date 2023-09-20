import type { DeclarationPlain, RulePlain } from 'css-tree';

import type { Nil } from '../../../common/general-utils.js';
import type {
  Dict,
  FrameNodeBlackList,
  GlobalExtender,
  OmitMethods,
  TextExtender,
} from '../../sb-serialize-preview/sb-serialize.model.js';
import type { CompContext, ModuleContext, NodeContext } from '../code.model.js';
import type { FwAttr } from '../frameworks/framework-connectors.js';
import { warnNode } from '../gen-node-utils/utils-and-reset.js';
import type { MUIConfig } from '../tech-integration/mui/mui-config.js';

// Most of this file has a big overlap with sb-serialize.model.ts. To refactor later.

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

export interface TextBlock {
  segments: TextSegment2[];
  blockStyles: Dict<DeclarationPlain>;
  textInlineWrapperStyles?: Dict<DeclarationPlain>;
}

export enum ListType {
  NONE,
  UNORDERED,
  ORDERED,
}

export interface ListBlock {
  paragraphBlocks: ParagraphBlock[];
  listType: ListType;
  markerStyles?: Dict<DeclarationPlain>;
}

export interface ParagraphBlock {
  textBlocks: TextBlock[];
}

export type RulePlainExtended = RulePlain & { parentRule?: RulePlain; childRules?: RulePlain[] };

interface TextExtender2 extends TextExtender {
  _textSegments?: TextSegment2[];
  _listBlocks?: ListBlock[];
}

type ExtendNodeType<Node, SpecificExtender = {}> = Omit<OmitMethods<Node>, FrameNodeBlackList> &
  GlobalExtender2 &
  SpecificExtender;

interface GlobalExtender2 extends GlobalExtender {
  isRootInComponent?: boolean;
  maskedBy?: Masker;
  // Should we group className, swapName, hideProp and textOverrideProp? It should be the same.
  className?: string;
  classOverride?: boolean;
  swapName?: string;
  swapOfNode?: InstanceNode2;
  foundIntermediateSwap?: boolean;
  hideProp?: string;
  textOverrideProp?: string;
  parent?: (BaseNode & ChildrenMixin) | null;
  autoWidth?: boolean;
  autoHeight?: boolean;
  mapHidesToProps?: () => void;
  mapSwapsToProps?: () => void;
  mapTextOverridesToProps?: () => void;
  nodeContext?: NodeContext;
  /** access it using getOrCreateCompContext() to ensure it is initialized */
  _context?: CompContext;
  visibleStrokes?: FrameNode2['strokes'];
  visibleFills?: Paint[];
  // Attributes useful for AST generation
  styles?: Dict<DeclarationPlain>;
  beforeStyles?: Dict<DeclarationPlain>;
  skip?: boolean;
  muiConfig?: MUIConfig | false; // For MUI instances
  componentContext?: ModuleContext; // For instance nodes
  noLayoutWithChildren?: boolean; // For groups to skip styling and directly process children
  textSkipStyles?: boolean; // For text nodes
  idAttached?: boolean;
  svgPathVarName?: string; // For SVG nodes
  extraAttributes?: FwAttr[];
  rule?: RulePlainExtended;
  htmlClass?: string;
}

// Incomplete typings. Complete by adding other node types when needed.
export type BaseNode2 = ExtendNodeType<BaseNode>;
export type PageNode2 = ExtendNodeType<PageNode> & ChildrenMixin2;
export type SceneNode2 = ExtendNodeType<SceneNode>;
export type VectorNode2 = ExtendNodeType<VectorNode, { _svg?: string }>;
export type VectorNodeDerived = ExtendNodeType<VectorNode | BooleanOperationNode, { _svg?: string }>;
export type TextNode2 = ExtendNodeType<TextNode, TextExtender2>;
export type FrameNode2 = ExtendNodeType<FrameNode> & ChildrenMixin2;
export type ComponentNode2 = ExtendNodeType<ComponentNode> & ChildrenMixin2;
export type ComponentSetNode2 = ExtendNodeType<ComponentSetNode> &
  // Adding overflowDirection as a workaround to fix a bug in Figma plugin API typings. The prop is actually there in Figma.
  ChildrenMixin2 & { overflowDirection: OverflowDirection };
export type InstanceNode2 = ExtendNodeType<InstanceNode> & ChildrenMixin2;
export type RectangleNode2 = ExtendNodeType<RectangleNode>;
export type GroupNode2 = ExtendNodeType<GroupNode> & ChildrenMixin2;
export type LineNode2 = ExtendNodeType<LineNode>;
export type BooleanOperationNode2 = ExtendNodeType<BooleanOperationNode> & ChildrenMixin2;
export type TextSegment2 = StyledTextSegment & { _segmentStyles: Dict<DeclarationPlain> };

export type MinimalStrokesMixin2 = ExtendNodeType<MinimalStrokesMixin>;
export type IndividualStrokesMixin2 = ExtendNodeType<IndividualStrokesMixin>;
export type AutoLayoutChildrenMixin2 = ExtendNodeType<AutoLayoutChildrenMixin>;

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
  const isVectorDetected = !!(node as VectorNode2)?._svg;
  return isVectorDetected || node?.type === 'VECTOR';
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
  // Components and instances are special frames. Does everything that happens to frame should also apply to components and instances in this project?
  // If yes, we can change the condition below to also match component and instance types.
  return (node as BaseNode2)?.type === 'FRAME' && !isVector(node);
}

export function isComponent(node: BaseNode2 | SceneNode2 | Nil): node is ComponentNode2 {
  const isComp = node?.type === 'COMPONENT';
  // A component can't be a vector (prohibited by the extraction)
  if (isComp && isVector(node)) {
    warnNode(
      node,
      'Is both a component and a vector, which is supposed to be prohibited in the config extraction (plugin).',
    );
  }
  return isComp;
}

export function isInstance(node: BaseNode2 | SceneNode2 | Nil): node is InstanceNode2 {
  const isInst = node?.type === 'INSTANCE';
  // An instance can't be a vector (prohibited by the extraction)
  if (isInst && isVector(node)) {
    warnNode(
      node,
      'Is both an instance and a vector, which is supposed to be prohibited in the config extraction (plugin).',
    );
  }
  return isInst;
}

// Assertion in control flow analysis
export function assertInstance(node: BaseNode2 | SceneNode2 | Nil): asserts node is InstanceNode2 {
  if (!isInstance(node)) {
    throw new Error(node ? `node ${(node as BaseNode2).name} is not an Instance` : `node is nil`);
  }
}

export function isInstanceFeatureDetection(node: BaseNode2 | SceneNode2 | Nil): node is InstanceNode2 {
  // For cases like fill with default values where we need to recognize what was originally an instance, even if we changed the type, e.g. to SVG.
  return !!(node as InstanceNode2).mainComponent || node?.type === 'INSTANCE';
}

// TODO to update after updating the lib. The layoutMode may have moved to AutoLayoutMixin.
export function isBaseFrameMixin(node: BaseNode2 | BaseFrameMixin | Nil): node is BaseFrameMixin {
  return !!(node as BaseFrameMixin)?.layoutMode;
}

export interface ChildrenMixin2 {
  children: ReadonlyArray<SceneNode2>;
}

export function isChildrenMixin(node: BaseNode2 | ChildrenMixin2 | Nil): node is ChildrenMixin2 {
  return !!(node as ChildrenMixin2)?.children;
}

// Assertion in control flow analysis
export function assertChildrenMixin(node: BaseNode2 | ChildrenMixin2 | Nil): asserts node is ChildrenMixin2 {
  if (!isChildrenMixin(node)) {
    throw new Error(node ? `node ${(node as BaseNode2).name} is not a ChildrenMixin` : `node is nil`);
  }
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
export type FlexNode = FrameNode2 | ComponentNode2 | ComponentSetNode2 | InstanceNode2;

export function isFlexNode(node: BaseNode2 | SceneNode2 | Nil): node is FlexNode {
  return (isFrame(node) || isComponent(node) || isComponentSet(node) || isInstance(node)) && !isVector(node);
}

// To check with new Figma typing lib. Also check isBaseFrameMixin that may be outdated.
// export function isAutoLayoutMixin(node: BaseNode2 | SceneNode2 | AutoLayoutMixin | Nil): node is AutoLayoutMixin {
//   return !!(node as AutoLayoutMixin).layoutMode;
// }

// GroupNode doesn't have auto-layout
export type BlockNode = FlexNode | RectangleNode2 | GroupNode2 | BooleanOperationNode2 | LineNode2;

export function isBlockNode(node: BaseNode2 | SceneNode2 | Nil): node is BlockNode {
  return (
    isFlexNode(node) ||
    isRectangle(node) ||
    isGroup(node) ||
    isBooleanOperation(node) ||
    isLine(node) ||
    isComponentSet(node)
  );
}

export type ValidNode = BlockNode | TextNode2 | VectorNodeDerived;

export function isValidNode(node: BaseNode2 | SceneNode2 | Nil): node is ValidNode {
  return isBlockNode(node) || isText(node) || isVector(node);
}

export function isMinimalStrokesMixin(
  node: BaseNode2 | SceneNode2 | Nil | MinimalStrokesMixin2,
): node is MinimalStrokesMixin2 {
  return !!(node as MinimalStrokesMixin2).strokeAlign;
}

export function isIndividualStrokesMixin(
  node: BaseNode2 | SceneNode2 | Nil | IndividualStrokesMixin2,
): node is IndividualStrokesMixin2 {
  return (node as IndividualStrokesMixin2).strokeBottomWeight != null;
}

export function isAutoLayoutChildrenMixin(
  node: BaseNode2 | SceneNode2 | Nil | AutoLayoutChildrenMixin2,
): node is AutoLayoutChildrenMixin2 {
  return (node as AutoLayoutChildrenMixin2).layoutAlign != null;
}
