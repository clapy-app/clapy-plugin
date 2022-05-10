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

export interface ExportCodePayload {
  parent: FrameNodeNoMethod | ComponentNodeNoMethod | InstanceNodeNoMethod | PageNodeNoMethod | null | undefined;
  root: SceneNodeNoMethod | null | undefined;
  components: ComponentNodeNoMethod[];
  images: ExportImageMap2;
  styles: FigmaStyles;
  extraConfig: { isClapyFile?: boolean; enableMUIFramework?: boolean };
}

export interface FigmaStyles {
  textStyles: Dict<TextStyle>;
  fillStyles: Dict<PaintStyle>;
  strokeStyles: Dict<PaintStyle>;
  effectStyles: Dict<EffectStyle>;
  gridStyles: Dict<GridStyle>;
}

type BaseNodeMixin2 = Omit<OmitMethods<BaseNodeMixin>, FrameNodeBlackList>;
type SceneNodeMixin2 = Omit<OmitMethods<SceneNodeMixin>, FrameNodeBlackList>;
type ReactionMixin2 = Omit<OmitMethods<ReactionMixin>, FrameNodeBlackList>;
type BlendMixin2 = Omit<OmitMethods<BlendMixin>, FrameNodeBlackList>;
type MinimalStrokesMixin2 = Omit<OmitMethods<MinimalStrokesMixin>, FrameNodeBlackList>;
type MinimalFillsMixin2 = Omit<OmitMethods<MinimalFillsMixin>, FrameNodeBlackList>;
type GeometryMixin2 = Omit<OmitMethods<GeometryMixin>, FrameNodeBlackList>;
type LayoutMixin2 = Omit<OmitMethods<LayoutMixin>, FrameNodeBlackList>;
type ExportMixin2 = Omit<OmitMethods<ExportMixin>, FrameNodeBlackList>;
interface DefaultShapeMixin2
  extends BaseNodeMixin2,
    SceneNodeMixin2,
    ReactionMixin2,
    BlendMixin2,
    GeometryMixin2,
    LayoutMixin2,
    ExportMixin2 {}
type ConstraintMixin2 = Omit<OmitMethods<ConstraintMixin>, FrameNodeBlackList>;
type TextSublayerNode2 = Omit<OmitMethods<TextSublayerNode>, FrameNodeBlackList>;
export type SceneNodeNoMethod = Omit<OmitMethods<SceneNode>, FrameNodeBlackList>;
export type TextNodeNoMethod = Omit<OmitMethods<TextNode> & { listSpacing: number }, FrameNodeBlackList>;
export type FrameNodeNoMethod = Omit<OmitMethods<FrameNode>, FrameNodeBlackList> & { children: SceneNodeNoMethod[] };
export type ComponentNodeNoMethod = Omit<OmitMethods<ComponentNode>, FrameNodeBlackList> & {
  children: SceneNodeNoMethod[];
};
export type InstanceNodeNoMethod = Omit<OmitMethods<InstanceNode>, FrameNodeBlackList> & {
  children: SceneNodeNoMethod[];
};
export type PageNodeNoMethod = Omit<OmitMethods<PageNode>, FrameNodeBlackList> & {
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

export type FrameNodeBlackList = Exclude<typeof extractionBlacklist[number], 'mainComponent'>;

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

const defaultLayoutNodeMixin: LayoutMixin2 = {
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

const defaultFrameNode: FrameNodeNoMethod = {
  ...defaultSceneNodeMixin,
  ...defaultLayoutNodeMixin,
  type: 'FRAME',
  opacity: 1,
  blendMode: 'PASS_THROUGH',
  isMask: false,
  effects: [],
  effectStyleId: '',
  rotation: 0,
  layoutAlign: 'INHERIT',
  layoutGrow: 0,
  fills: [],
  fillStyleId: 'fake',
  strokes: [],
  strokeStyleId: '',
  strokeWeight: 0,
  strokeAlign: 'INSIDE',
  strokeJoin: 'MITER',
  dashPattern: [],
  strokeCap: 'NONE',
  strokeMiterLimit: 4,
  cornerSmoothing: 0,
  topLeftRadius: 0,
  topRightRadius: 0,
  bottomLeftRadius: 0,
  bottomRightRadius: 0,
  paddingLeft: 0,
  paddingRight: 0,
  paddingTop: 0,
  paddingBottom: 0,
  primaryAxisAlignItems: 'MIN',
  counterAxisAlignItems: 'MIN',
  primaryAxisSizingMode: 'FIXED',
  layoutGrids: [],
  gridStyleId: '',
  clipsContent: false,
  constraints: { horizontal: 'MIN', vertical: 'MIN' },
  layoutMode: 'HORIZONTAL',
  counterAxisSizingMode: 'FIXED',
  itemSpacing: 0,
  overflowDirection: 'NONE',
  numberOfFixedChildren: 0,
  overlayPositionType: 'CENTER',
  overlayBackground: { type: 'NONE' },
  overlayBackgroundInteraction: 'NONE',
  reactions: [],
  children: [],
};

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
  ...defaultLayoutNodeMixin,
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

const defaultTextNode: TextNodeNoMethod = {
  ...defaultDefaultShapeMixin,
  ...defaultConstraintMixin,
  ...defaultTextSublayerNode,
  listSpacing: 0,
  type: 'TEXT',
  textAlignHorizontal: 'CENTER',
  textAlignVertical: 'CENTER',
  textAutoResize: 'WIDTH_AND_HEIGHT',
  autoRename: true,
  textStyleId: '',
};

// TODO continue using and adding default values by type

/**
 * @deprecated Legacy; prefer above defaults that are specific to the type.
 */
// This default matches the default CSS style, i.e. it should match the CSS global resets.
export const defaultNode: Dict2<
  keyof (FrameNodeNoMethod & Omit<ComponentNodeNoMethod, 'type'> & Omit<TextNodeNoMethod, 'type'>),
  any
> = {
  id: 'fake',
  type: 'FRAME',
  name: '',
  visible: true,
  opacity: 1,
  blendMode: 'PASS_THROUGH',
  isMask: false,
  effects: [],
  effectStyleId: '',
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  rotation: 0,
  layoutAlign: 'INHERIT',
  layoutGrow: 0,
  fills: [],
  fillStyleId: 'fake',
  strokes: [],
  strokeStyleId: '',
  strokeWeight: 0,
  strokeAlign: 'INSIDE',
  strokeJoin: 'MITER',
  dashPattern: [],
  strokeCap: 'NONE',
  strokeMiterLimit: 4,
  cornerSmoothing: 0,
  topLeftRadius: 0,
  topRightRadius: 0,
  bottomLeftRadius: 0,
  bottomRightRadius: 0,
  paddingLeft: 0,
  paddingRight: 0,
  paddingTop: 0,
  paddingBottom: 0,
  primaryAxisAlignItems: 'MIN',
  counterAxisAlignItems: 'MIN',
  primaryAxisSizingMode: 'FIXED',
  layoutGrids: [],
  gridStyleId: '',
  clipsContent: false,
  constraints: { horizontal: 'MIN', vertical: 'MIN' },
  layoutMode: 'HORIZONTAL',
  counterAxisSizingMode: 'FIXED',
  itemSpacing: 0,
  overflowDirection: 'NONE',
  numberOfFixedChildren: 0,
  overlayPositionType: 'CENTER',
  overlayBackground: { type: 'NONE' },
  overlayBackgroundInteraction: 'NONE',
  reactions: [],
  children: [],
  stuckNodes: [],
  relativeTransform: [
    [1, 0, 0],
    [0, 1, 0],
  ],
  description: '',
  documentationLinks: [],
  key: '',
  remote: false,
  variantProperties: null,
  listSpacing: 0,
  hasMissingFont: false,
  paragraphIndent: 0,
  paragraphSpacing: 0,
  autoRename: true,
  textAlignHorizontal: 'CENTER',
  textAlignVertical: 'CENTER',
  textAutoResize: 'WIDTH_AND_HEIGHT',
};
