export type { Property } from 'csstype';

// import type { Properties as CSSProperties } from 'csstype';
// export type Properties = CSSProperties;

// Instead of above the type that is exhaustive (but heavy), let's try below simplification to see if TypeScript is much faster without the full CSS typing.
export type Properties = Dict<any>;

// Another option: Partial<CSSStyleDeclaration>
// but with it, assigning a string value causes a typing error, I don't know how to solve it without over-engineering the typing.

export interface Dict<T = any> {
  [key: string | number | symbol]: T;
}
export type ObjKey = string | number | symbol;
export type Dict2<Key extends ObjKey, Value> = Partial<{
  [key in Key]: Value;
}>;

export type Intersect<T, U> = Extract<T, U>;

type EmptyObj = Record<string, never>;

const black = 'rgb(0, 0, 0)';
const backWithOp = 'rgba(0, 0, 0, 0)';
const zeroPx = '0px';

// Playground with auto-completed values:
// const playground: Properties = {
//   display: 'block',
// };

export const cssDefaults = makeCssDefaults({
  display: 'block',
  flexDirection: 'row',
  width: 'auto',
  height: 'auto',
  fontSize: '16px',
  fontFamily: 'Times New Roman',
  fontStretch: 'normal',
  fontStyle: 'normal',
  fontWeight: '400',
  lineHeight: '16px',
  textAlign: 'start',
  color: black,
  backgroundColor: backWithOp,
  borderTopColor: black,
  borderTopStyle: 'none',
  borderTopWidth: zeroPx,
  borderRightColor: black,
  borderRightStyle: 'none',
  borderRightWidth: zeroPx,
  borderBottomColor: black,
  borderBottomStyle: 'none',
  borderBottomWidth: zeroPx,
  borderLeftColor: black,
  borderLeftStyle: 'none',
  borderLeftWidth: zeroPx,
  position: 'static',
  left: 'auto',
  top: 'auto',
  right: 'auto',
  bottom: 'auto',
  paddingTop: zeroPx,
  paddingRight: zeroPx,
  paddingBottom: zeroPx,
  paddingLeft: zeroPx,
  marginTop: zeroPx,
  marginRight: zeroPx,
  marginBottom: zeroPx,
  marginLeft: zeroPx,
  boxShadow: 'none',
  backgroundImage: 'none',
  transform: 'none',
  borderTopLeftRadius: zeroPx,
  borderTopRightRadius: zeroPx,
  borderBottomLeftRadius: zeroPx,
  borderBottomRightRadius: zeroPx,
  boxSizing: 'content-box',
  textDecorationLine: 'none',
  textDecorationThickness: 'auto',
  textDecorationStyle: 'solid',
  textDecorationColor: black,
  alignItems: 'normal',
  justifyContent: 'normal',
  flexGrow: '0',
  flexBasis: 'auto',
  overflowX: 'visible',
  overflowY: 'visible',
  opacity: '1',
});

// If we need to enable null. But it's a dangerious scenario, because there are cases of top-level text nodes which styles are the default styles. What's done above is that default text styles are provided when there is no clear default.
// type PropertiesOrNull = {
//   [P in keyof Properties]: Properties[P] | null;
// };

function makeCssDefaults<T extends Properties>(rules: T): T {
  return rules;
}

export type CssDefaults = typeof cssDefaults;

const cssKeys = Object.keys(cssDefaults) as (keyof typeof cssDefaults)[];
type CssKeys = typeof cssKeys;

export type MyStyles = Required<Pick<Properties, CssKeys[number]>>;
export type MyStylesPE = MyStyles & { content: string };
export type MyStyleRules = Properties;
export type MyCSSVariables = MyStyleRules /* Dict<string> */;

export type StyleKey = Exclude<keyof MyStyleRules, 'length' | 'parentRule'>;

// type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
// type OptionalExcept<T, K extends keyof T> = Pick<T, K> & Omit<Partial<T>, K>;
type CSSStyleDeclarationMethods =
  | 'getPropertyPriority'
  | 'getPropertyValue'
  | 'item'
  | 'removeProperty'
  | 'setProperty';

// export type MyCSSStyleDeclaration = OptionalExcept<CSSStyleDeclaration, CSSStyleDeclarationMethods>;

// Adding src which is missing in the original typing, surprisingly, although it's a valid key for font faces.
export type CSSStyleDeclarationNoMethod = Partial<
  Omit<CSSStyleDeclaration & { src: string }, CSSStyleDeclarationMethods>
>;

export const ELEMENT_NODE = 1; /* Node.ELEMENT_NODE */
const PSEUDO_ELEMENT_NODE = -1;
const TEXT_NODE = 3; /* Node.TEXT_NODE */

interface CEltSharedInterface {
  name: string;
  styleRules: MyStyleRules;
  isFullWidth: boolean; // filled by prepareFullWidthHeightAttr()
  isFullHeight: boolean;
  image?: {
    type: 'Buffer';
    data: number[];
  };
  svg?: string;
}

export interface CElementNode extends CEltSharedInterface {
  type: typeof ELEMENT_NODE;
  styles: MyStyles;

  className: string | undefined;
  src?: string;
  children?: CNode[];
}

export type CPseudoElementNode = CEltSharedInterface & {
  type: typeof PSEUDO_ELEMENT_NODE;
  styles: MyStylesPE;
  isFontIcon: boolean;
};

export interface CTextNode {
  name: '#text';
  type: typeof TEXT_NODE;
  value: string | null;
}
export type CNode = CElementNode | CPseudoElementNode | CTextNode;

export function isCElementNode(node: CNode): node is CElementNode {
  return node.type === ELEMENT_NODE;
}

export function isCPseudoElementNode(node: CNode): node is CPseudoElementNode {
  return node.type === PSEUDO_ELEMENT_NODE;
}

export function isCTextNode(node: CNode): node is CTextNode {
  return node.type === TEXT_NODE;
}

export interface ArgType {
  control?: { type: 'boolean' | 'select' };
  options?: string[];
  table?: { defaultValue: { summary: any /* JSON-stringified value */ } };
  // name: string /* "active" */;
  type: {
    name: string /* 'boolean' */;
    required: boolean;
    value?: any[] | EmptyObj;
  };
}

export type ArgTypes = Dict<ArgType>;
export type Args = Dict<any>; // key: arg name, value: arg value

export interface SbStory {
  // argTypes,
  // args,
  componentId: string;
  initialArgs: Args;
  // id: string;
  kind: string;
  name: string;
  parameters: {
    // docs,
    // docsOnly,
    // fileName,
    // framework,
    // options,
    // themes,
    // viewMode,
    // __id,
    argTypes: ArgTypes;
    __isArgsStory: boolean;
  };
  story: string;
  title: string;
}

export type SbStories = Dict<SbStory>;

export interface SbStoriesWrapper {
  // globalParameters: {};
  // globals: {};
  // kindParameters: {};
  stories: SbStories;
  v: number;
  title: string;
}

export interface SbStoryInput extends SbStory {
  id: string;
}

export type SbStoriesInput = Dict<SbStoryInput>;

export interface SbStoriesWrapperInput {
  stories: SbStoriesInput;
  v: number;
}

export type OmitMethods<T> = {
  [P in keyof T as T[P] extends Function ? never : P]: T[P];
};

export interface ExtraConfig {
  isClapyFile?: boolean;
  isFTD?: boolean;
  enableMUIFramework?: boolean;
  output?: 'csb' | 'zip';
  useViteJS?: boolean;
}

export interface ExportCodePayload {
  parent: FrameNodeNoMethod | ComponentNodeNoMethod | InstanceNodeNoMethod | PageNodeNoMethod | null | undefined;
  root: SceneNodeNoMethod | null | undefined;
  components: ComponentNodeNoMethod[];
  images: ExportImageMap2;
  styles: FigmaStyles;
  extraConfig: ExtraConfig;
  tokens?: Dict; // TODO better typing
}

export interface FigmaStyles {
  textStyles: Dict<TextStyle>;
  fillStyles: Dict<PaintStyle>;
  strokeStyles: Dict<PaintStyle>;
  effectStyles: Dict<EffectStyle>;
  gridStyles: Dict<GridStyle>;
}

// type UpdateChildren<T> = T extends ChildrenMixin ? Omit<T, 'children'> & { children: ReadonlyArray<LayoutNode> } : T;
type ClapifyNode<T> = Omit<OmitMethods<T>, FrameNodeBlackList>;
// & T extends ChildrenMixin
// ? { children: ReadonlyArray<ClapifyNode<T['children']> /* LayoutNode */> }
// : {};
// type UpdateChildren2<T> = T extends ChildrenMixin ? Omit<T, 'children'> & { children: ReadonlyArray<LayoutNode> } : T;
// type ClapifyNode2<T> = UpdateChildren2<Omit<OmitMethods<T>, FrameNodeBlackList>>;
// type FrameNode3 = ClapifyNode2<UpdateChildren2<FrameNode>>;
// type A = FrameNode3['c
// const f: ClapifyNode2<FrameNode>;
// f.chil

type BaseNodeMixin2 = ClapifyNode<BaseNodeMixin>;
type SceneNodeMixin2 = ClapifyNode<SceneNodeMixin>;
type ChildrenMixin2 = {
  children: ReadonlyArray<LayoutNode>;
} /* Omit<OmitMethods<ChildrenMixin>, FrameNodeBlackList> */;
type ReactionMixin2 = ClapifyNode<ReactionMixin>;
type BlendMixin2 = ClapifyNode<BlendMixin>;
type MinimalStrokesMixin2 = ClapifyNode<MinimalStrokesMixin>;
type MinimalFillsMixin2 = ClapifyNode<MinimalFillsMixin>;
type GeometryMixin2 = ClapifyNode<GeometryMixin>;
type LayoutMixin2 = ClapifyNode<LayoutMixin>;
type ExportMixin2 = ClapifyNode<ExportMixin>;
interface DefaultShapeMixin2
  extends BaseNodeMixin2,
    SceneNodeMixin2,
    ReactionMixin2,
    BlendMixin2,
    GeometryMixin2,
    LayoutMixin2,
    ExportMixin2 {}
type ConstraintMixin2 = ClapifyNode<ConstraintMixin>;
type TextSublayerNode2 = ClapifyNode<TextSublayerNode>;
type ContainerMixin2 = ClapifyNode<ContainerMixin>;
type CornerMixin2 = ClapifyNode<CornerMixin>;
type RectangleCornerMixin2 = ClapifyNode<RectangleCornerMixin>;
type BaseFrameMixin2 = ClapifyNode<BaseFrameMixin> & ChildrenMixin2;
type FramePrototypingMixin2 = ClapifyNode<FramePrototypingMixin>;
type DefaultFrameMixin2 = ClapifyNode<DefaultFrameMixin>;
type PublishableMixin2 = ClapifyNode<PublishableMixin>;
type VariantMixin2 = ClapifyNode<VariantMixin>;
type VectorLikeMixin2 = ClapifyNode<VectorLikeMixin>;
type StickableMixin2 = ClapifyNode<StickableMixin>;

type PageNode2 = ClapifyNode<PageNode> & ChildrenMixin2;
type SliceNode2 = ClapifyNode<SliceNode>;
export type FrameNode2 = ClapifyNode<FrameNode>;
type GroupNode2 = ClapifyNode<GroupNode> & ChildrenMixin2;
type ComponentSetNode2 = ClapifyNode<ComponentSetNode>;
type ComponentNode2 = ClapifyNode<ComponentNode>;
type InstanceNode2 = ClapifyNode<InstanceNode>;
type BooleanOperationNode2 = ClapifyNode<BooleanOperationNode> & ChildrenMixin2;
type VectorNode2 = ClapifyNode<VectorNode>;
type StarNode2 = ClapifyNode<StarNode>;
type LineNode2 = ClapifyNode<LineNode>;
type EllipseNode2 = ClapifyNode<EllipseNode>;
type PolygonNode2 = ClapifyNode<PolygonNode>;
type RectangleNode2 = ClapifyNode<RectangleNode>;
type StampNode2 = ClapifyNode<StampNode>;

// Later: rename XXNoMethod to XX2 to be consistent with the back.
export type SceneNodeNoMethod = ClapifyNode<SceneNode>;
export type TextNodeNoMethod = ClapifyNode<TextNode> & { listSpacing: number };
export type FrameNodeNoMethod = ClapifyNode<FrameNode> & { children: SceneNodeNoMethod[] };
export type ComponentNodeNoMethod = ClapifyNode<ComponentNode> & {
  children: SceneNodeNoMethod[];
};
export type InstanceNodeNoMethod = ClapifyNode<InstanceNode> & {
  children: SceneNodeNoMethod[];
};
export type PageNodeNoMethod = ClapifyNode<PageNode> & {
  children: SceneNodeNoMethod[];
};

export const extractionBlacklist = [
  'parent',
  'children',
  'removed',
  'masterComponent',
  'mainComponent',
  'horizontalPadding',
  'verticalPadding',
  'cornerRadius',
  'fillGeometry',
  'strokeGeometry',
  'vectorPaths',
  'backgrounds',
  'backgroundStyleId',
  'locked',
  'constrainProportions',
  'guides',
  'expanded',
  'absoluteTransform',
  'absoluteRenderBounds',
  'vectorNetwork',
  'exportSettings',
  'canUpgradeToNativeBidiSupport',
] as const;

export type FrameNodeBlackList = Exclude<typeof extractionBlacklist[number], 'mainComponent' /* | 'children' */>;

export interface CSBResponse {
  sandbox_id: string;
}

// From magic-bytes.js, for portability with the backend that doesn't have the lib
type Info = {
  mime?: string;
  extension?: string;
};
type GuessedFile = Info & {
  typename: string;
};
export type ExportImageEntry = {
  // Uint8Array serialized (with Array.from(uint8Array)).
  // Unserialize with Uint8Array.from(bytes)
  bytes: number[];
} & Partial<GuessedFile>;

export type ExportImagesFigma = Dict<ExportImageEntry>;
export type ExportImageMap2 = Dict<{ url: string | undefined } & Partial<GuessedFile>>;

const defaultSceneNodeMixin: SceneNodeMixin2 & { id: string; name: string } = {
  id: null as unknown as '', // Should be overridden
  name: '',
  visible: true,
  stuckNodes: [],
};

const defaultChildrenMixin: ChildrenMixin2 = {
  children: [],
};

const defaultLayoutMixin: LayoutMixin2 = {
  relativeTransform: [
    [1, 0, 0],
    [0, 1, 0],
  ],
  x: 0,
  y: 0,
  rotation: 0,
  width: 0,
  height: 0,
  layoutAlign: 'INHERIT',
  layoutGrow: 0,
};

// const defaultSceneNode: SceneNodeNoMethod = {
//   id: null as unknown as '', // Should be overridden
//   type: null as unknown as 'FRAME', // Should be overridden
//   name: '',
//   visible: true,
//   x: 0,
//   y: 0,
//   width: 0,
//   height: 0,
//   stuckNodes: [],
//   relativeTransform: [
//     [1, 0, 0],
//     [0, 1, 0],
//   ],
// };

const defaultBaseNodeMixin: BaseNodeMixin2 = {
  id: null as unknown as '', // Should be overridden
  name: '',
};

const defaultSceneNodeMixin2: SceneNodeMixin2 = {
  visible: true,
  stuckNodes: [],
};

const defaultReactionMixin: ReactionMixin2 = {
  reactions: [],
};

const defaultBlendMixin: BlendMixin2 = {
  opacity: 1,
  blendMode: 'PASS_THROUGH',
  isMask: false,
  effects: [],
  effectStyleId: '',
};

const defaultMinimalStrokesMixin: MinimalStrokesMixin2 = {
  strokes: [],
  strokeStyleId: '',
  strokeWeight: 0,
  strokeJoin: 'MITER',
  strokeAlign: 'INSIDE',
  dashPattern: [],
};

const defaultMinimalFillsMixin: MinimalFillsMixin2 = {
  fills: [],
  fillStyleId: '',
};

const defaultGeometryMixin: GeometryMixin2 = {
  ...defaultMinimalStrokesMixin,
  ...defaultMinimalFillsMixin,
  strokeCap: 'NONE',
  strokeMiterLimit: 4,
};

const defaultExportMixin: ExportMixin2 = {
  exportSettings: [],
};

const defaultDefaultShapeMixin: DefaultShapeMixin2 = {
  ...defaultBaseNodeMixin,
  ...defaultSceneNodeMixin2,
  ...defaultReactionMixin,
  ...defaultBlendMixin,
  ...defaultGeometryMixin,
  ...defaultLayoutMixin,
  ...defaultExportMixin,
};

const defaultConstraintMixin: ConstraintMixin2 = {
  constraints: { horizontal: 'MIN', vertical: 'MIN' },
};

const defaultTextSublayerNode: TextSublayerNode2 = {
  hasMissingFont: false,
  paragraphIndent: 0,
  paragraphSpacing: 0,
  fontSize: 0,
  fontName: {
    family: 'Inter',
    style: 'Medium',
  },
  textCase: 'ORIGINAL',
  textDecoration: 'NONE',
  letterSpacing: {
    unit: 'PERCENT',
    value: 0,
  },
  lineHeight: {
    unit: 'AUTO',
  },
  hyperlink: null,
  characters: '',
};

const defaultContainerMixin: ContainerMixin2 = {};

const defaultCornerMixin: CornerMixin2 = {
  cornerSmoothing: 0,
};

const defaultRectangleCornerMixin: RectangleCornerMixin2 = {
  topLeftRadius: 0,
  topRightRadius: 0,
  bottomLeftRadius: 0,
  bottomRightRadius: 0,
};

const defaultBaseFrameMixin: BaseFrameMixin2 = {
  ...defaultBaseNodeMixin,
  ...defaultSceneNodeMixin,
  ...defaultChildrenMixin,
  ...defaultContainerMixin,
  ...defaultGeometryMixin,
  ...defaultCornerMixin,
  ...defaultRectangleCornerMixin,
  ...defaultBlendMixin,
  ...defaultConstraintMixin,
  ...defaultLayoutMixin,
  ...defaultExportMixin,
  layoutMode: 'HORIZONTAL',
  primaryAxisSizingMode: 'FIXED',
  counterAxisSizingMode: 'FIXED',
  primaryAxisAlignItems: 'MIN',
  counterAxisAlignItems: 'MIN',
  paddingLeft: 0,
  paddingRight: 0,
  paddingTop: 0,
  paddingBottom: 0,
  itemSpacing: 0,
  layoutGrids: [],
  gridStyleId: '',
  clipsContent: false,
};

const defaultFramePrototypingMixin: FramePrototypingMixin2 = {
  overflowDirection: 'NONE',
  numberOfFixedChildren: 0,
  overlayPositionType: 'CENTER',
  overlayBackground: { type: 'NONE' },
  overlayBackgroundInteraction: 'NONE',
};

const defaultDefaultFrameMixin: DefaultFrameMixin2 = {
  ...defaultBaseFrameMixin,
  ...defaultFramePrototypingMixin,
  ...defaultReactionMixin,
};

const defaultPublishableMixin: PublishableMixin2 = {
  description: '',
  documentationLinks: [],
  remote: false,
  key: '',
};

const defaultVariantMixin: VariantMixin2 = {
  variantProperties: null,
};

const defaultVectorLikeMixin: VectorLikeMixin2 = {
  handleMirroring: 'NONE',
};

const defaultStickableMixin: StickableMixin2 = { stuckTo: null };

// PageNode

const defaultPageNode: PageNode2 = {
  ...defaultBaseNodeMixin,
  ...defaultChildrenMixin,
  ...defaultExportMixin,
  type: 'PAGE',
  selection: [],
  selectedTextRange: null,
  flowStartingPoints: [],
  // backgrounds: [
  //   {
  //     type: 'SOLID',
  //     visible: true,
  //     opacity: 1,
  //     blendMode: 'NORMAL',
  //     color: { r: 0.8980392217636108, g: 0.8980392217636108, b: 0.8980392217636108 },
  //   },
  // ],
  prototypeBackgrounds: [
    { type: 'SOLID', visible: true, opacity: 0, blendMode: 'NORMAL', color: { r: 0, g: 0, b: 0 } },
  ],
  prototypeStartNode: null,
};

// SliceNode

const defaultSliceNode: SliceNode2 = {
  ...defaultBaseNodeMixin,
  ...defaultSceneNodeMixin,
  ...defaultLayoutMixin,
  ...defaultExportMixin,
  type: 'SLICE',
};

// FrameNode

const defaultFrameNode: FrameNode2 = {
  ...defaultDefaultFrameMixin,
  type: 'FRAME',
};

// GroupNode

const defaultGroupNode: GroupNode2 = {
  ...defaultBaseNodeMixin,
  ...defaultSceneNodeMixin,
  ...defaultReactionMixin,
  ...defaultChildrenMixin,
  ...defaultContainerMixin,
  ...defaultBlendMixin,
  ...defaultLayoutMixin,
  ...defaultExportMixin,
  type: 'GROUP',
};

// ComponentSetNode

const defaultComponentSetNode: ComponentSetNode2 = {
  ...defaultBaseFrameMixin,
  ...defaultPublishableMixin,
  type: 'COMPONENT_SET',
  defaultVariant: null as unknown as ComponentNode, // To override
  variantGroupProperties: {},
};

// ComponentNode

const defaultComponentNode: ComponentNode2 = {
  ...defaultDefaultFrameMixin,
  ...defaultPublishableMixin,
  ...defaultVariantMixin,
  type: 'COMPONENT',
};

// InstanceNode

const defaultInstanceNode: InstanceNode2 = {
  ...defaultDefaultFrameMixin,
  ...defaultVariantMixin,
  type: 'INSTANCE',
  mainComponent: null,
  scaleFactor: 1,
};

// BooleanOperationNode

const defaultBooleanOperationNode: BooleanOperationNode2 = {
  ...defaultDefaultShapeMixin,
  ...defaultChildrenMixin,
  ...defaultCornerMixin,
  type: 'BOOLEAN_OPERATION',
  booleanOperation: 'UNION',
};

// VectorNode

const defaultVectorNode: VectorNode2 = {
  ...defaultDefaultShapeMixin,
  ...defaultConstraintMixin,
  ...defaultCornerMixin,
  ...defaultVectorLikeMixin,
  type: 'VECTOR',
};

// StarNode

const defaultStarNode: StarNode2 = {
  ...defaultDefaultShapeMixin,
  ...defaultConstraintMixin,
  ...defaultCornerMixin,
  type: 'STAR',
  pointCount: 5,
  innerRadius: 0.3819660246372223,
};

// LineNode

const defaultLineNode: LineNode2 = {
  ...defaultDefaultShapeMixin,
  ...defaultConstraintMixin,
  type: 'LINE',
};

// EllipseNode

const defaultEllipseNode: EllipseNode2 = {
  ...defaultDefaultShapeMixin,
  ...defaultConstraintMixin,
  ...defaultCornerMixin,
  type: 'ELLIPSE',
  arcData: {
    startingAngle: 0,
    endingAngle: 6.2831854820251465,
    innerRadius: 0,
  },
};

// PolygonNode

const defaultPolygonNode: PolygonNode2 = {
  ...defaultDefaultShapeMixin,
  ...defaultConstraintMixin,
  ...defaultCornerMixin,
  type: 'POLYGON',
  pointCount: 3,
};

// RectangleNode

const defaultRectangleNode: RectangleNode2 = {
  ...defaultDefaultShapeMixin,
  ...defaultConstraintMixin,
  ...defaultCornerMixin,
  ...defaultRectangleCornerMixin,
  type: 'RECTANGLE',
};

// TextNode

const defaultTextNode: TextNodeNoMethod = {
  ...defaultDefaultShapeMixin,
  ...defaultConstraintMixin,
  ...defaultTextSublayerNode,
  type: 'TEXT',
  listSpacing: 0,
  textAlignHorizontal: 'CENTER',
  textAlignVertical: 'CENTER',
  textAutoResize: 'WIDTH_AND_HEIGHT',
  autoRename: true,
  textStyleId: '',
};

// StampNode

const defaultStampNode: StampNode2 = {
  ...defaultDefaultShapeMixin,
  ...defaultConstraintMixin,
  ...defaultStickableMixin,
  type: 'STAMP',
};

export type LayoutNode =
  | SliceNode2
  | FrameNode2
  | GroupNode2
  | ComponentSetNode2
  | ComponentNode2
  | InstanceNode2
  | BooleanOperationNode2
  | VectorNode2
  | StarNode2
  | LineNode2
  | EllipseNode2
  | PolygonNode2
  | RectangleNode2
  | TextNodeNoMethod
  | StampNode2;

export type NodeWithDefaults = LayoutNode | PageNode2;

// Function used to type-check the defaults below and ensure all keys are correctly mapped.
function makeNodeDefaults<T extends { [key in NodeWithDefaults['type']]: NodeWithDefaults & { type: key } }>(
  defaults: T,
) {
  return defaults;
}

export const nodeDefaults = makeNodeDefaults({
  PAGE: defaultPageNode,
  SLICE: defaultSliceNode,
  FRAME: defaultFrameNode,
  GROUP: defaultGroupNode,
  COMPONENT_SET: defaultComponentSetNode,
  COMPONENT: defaultComponentNode,
  INSTANCE: defaultInstanceNode,
  BOOLEAN_OPERATION: defaultBooleanOperationNode,
  VECTOR: defaultVectorNode,
  STAR: defaultStarNode,
  LINE: defaultLineNode,
  ELLIPSE: defaultEllipseNode,
  POLYGON: defaultPolygonNode,
  RECTANGLE: defaultRectangleNode,
  TEXT: defaultTextNode,
  STAMP: defaultStampNode,
});
