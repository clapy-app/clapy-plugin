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
  parent: FrameNode | ComponentNode | InstanceNode | PageNode;
  root: SceneNodeNoMethod;
  images: ExportImageMap2;
  extraConfig: { isClapyFile: boolean };
}

export type SceneNodeNoMethod = Omit<OmitMethods<SceneNode>, FrameNodeBlackList>;
export type TextNodeNoMethod = OmitMethods<TextNode>;
export type FrameNodeNoMethod = Omit<OmitMethods<FrameNode>, FrameNodeBlackList> & { children: SceneNodeNoMethod[] };

export const baseBlacklist = [
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
  'relativeTransform',
  'absoluteTransform',
  'absoluteRenderBounds',
  'vectorNetwork',
  'exportSettings',
] as const;

export type FrameNodeBlackList = typeof baseBlacklist[number];

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
