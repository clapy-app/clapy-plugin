import { Properties as CSSProperties } from 'csstype';
export type Properties = CSSProperties;

export const cssKeys = makeCssKeys([
  'display',
  'flexDirection',
  'width',
  'height',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'textAlign',
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderTopStyle',
  'borderTopWidth',
  'borderRightColor',
  'borderRightStyle',
  'borderRightWidth',
  'borderBottomColor',
  'borderBottomStyle',
  'borderBottomWidth',
  'borderLeftColor',
  'borderLeftStyle',
  'borderLeftWidth',
  'position',
  'left',
  'top',
  'right',
  'bottom',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'boxShadow',
]);

function makeCssKeys<T extends Partial<keyof CSSProperties>>(rules: T[]): T[] {
  return rules;
}

export type MyStyles = Pick<CSSProperties, typeof cssKeys[number]>;

export interface CElementNode {
  name: string;
  type: typeof Node.ELEMENT_NODE;
  styles: MyStyles;
  children?: CNode[];
}
export interface CTextNode {
  name: '#text';
  type: typeof Node.TEXT_NODE;
  styles: MyStyles;
  value: string;
}
export type CNode = CElementNode | CTextNode;

const ELEMENT_NODE = 1; /* Node.ELEMENT_NODE */
const TEXT_NODE = 3; /* Node.TEXT_NODE */

export function isCElementNode(node: CNode): node is CElementNode {
  return node.type === ELEMENT_NODE;
}

export function isCTextNode(node: CNode): node is CTextNode {
  return node.type === TEXT_NODE;
}