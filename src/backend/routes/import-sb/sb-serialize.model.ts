import { Properties as CSSProperties } from 'csstype';
export type Properties = CSSProperties;

interface Dict<T = any> {
  [key: string]: T;
}

const black = 'rgb(0, 0, 0)';
const backWithOp = 'rgba(0, 0, 0, 0)';
const zeroPx = '0px';

// Playground with auto-completed values:
// const playground: CSSProperties = {
//   display: 'block',
// };

export const cssDefaults = makeCssDefaults({
  display: 'block',
  flexDirection: 'row',
  width: 'auto',
  height: 'auto',
  fontSize: undefined,
  fontWeight: '400',
  lineHeight: undefined,
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
});

function makeCssDefaults<T extends CSSProperties>(rules: T): T {
  return rules;
}

export type CssDefaults = typeof cssDefaults;

const cssKeys = Object.keys(cssDefaults) as (keyof typeof cssDefaults)[];
type CssKeys = typeof cssKeys;

export type MyStyles = Pick<CSSProperties, CssKeys[number]>;

const ELEMENT_NODE = 1; /* Node.ELEMENT_NODE */
const PSEUDO_ELEMENT_NODE = -1;
const TEXT_NODE = 3; /* Node.TEXT_NODE */

export interface CElementNode {
  name: string;
  type: typeof ELEMENT_NODE;
  styles: MyStyles;
  children?: CNode[];
}
export interface CPseudoElementNode {
  name: string;
  type: typeof PSEUDO_ELEMENT_NODE;
  styles: MyStyles;
}
export interface CTextNode {
  name: '#text';
  type: typeof TEXT_NODE;
  styles: MyStyles;
  value: string;
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

export interface SbStory {
  // argTypes,
  // args,
  // componentId,
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
    __isArgsStory: boolean;
  },
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
