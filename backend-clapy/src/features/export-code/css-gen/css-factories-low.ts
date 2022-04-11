import {
  AtrulePlain,
  BlockPlain,
  ClassSelector,
  Combinator,
  Comment,
  CssNodePlain,
  DeclarationPlain,
  Dimension,
  Identifier,
  IdSelector,
  NumberNode,
  Operator,
  Raw,
  RulePlain,
  SelectorListPlain,
  SelectorPlain,
  StyleSheetPlain,
  TypeSelector,
  ValuePlain,
  WhiteSpace,
} from 'css-tree';

import { csstree } from '../create-ts-compiler/csstree';

export function cssAstToString(css: CssNodePlain) {
  return csstree.generate(csstree.fromPlainObject(css));
}

export type CssRootNode = AtrulePlain | RulePlain;

export function mkStylesheetCss(children: CssRootNode[]) {
  const stylesheet: StyleSheetPlain = {
    type: 'StyleSheet',
    children,
  };
  return stylesheet;
}

export function mkRuleCss(selectorList: SelectorListPlain, block: BlockPlain) {
  const rule: RulePlain = {
    type: 'Rule',
    prelude: selectorList,
    block,
  };
  return rule;
}

type SelectorNode = SelectorPlain;

export function mkSelectorListCss(children: SelectorNode[]) {
  const selectorList: SelectorListPlain = {
    type: 'SelectorList',
    children,
  };
  return selectorList;
}

type SelectorFragment = IdSelector | ClassSelector | TypeSelector | Combinator;

export function mkSelectorCss(children: SelectorFragment[]) {
  const selector: SelectorPlain = {
    type: 'Selector',
    children,
  };
  return selector;
}

export function mkClassSelectorCss(name: string) {
  const classSelector: ClassSelector = {
    type: 'ClassSelector',
    name,
  };
  return classSelector;
}

// type BlockChild = DeclarationPlain; // If required - find a better type name

export function mkBlockCss(children: DeclarationPlain[]) {
  const block: BlockPlain = {
    type: 'Block',
    children,
  };
  return block;
}

export function mkDeclarationCss(property: string, value: ValuePlain, important = false) {
  // TODO property: better typing for auto-completion if useful
  const declaration: DeclarationPlain = {
    type: 'Declaration',
    important,
    property,
    value,
  };
  return declaration;
}

type ValueFragment = Dimension | Identifier | NumberNode | Operator | Raw;

export function mkValueCss(children: ValueFragment[]) {
  const value: ValuePlain = {
    type: 'Value',
    children,
  };
  return value;
}

export function mkDimensionCss(value: number, unit: string) {
  const dimension: Dimension = {
    type: 'Dimension',
    value: value.toString(),
    unit,
  };
  return dimension;
}

export function mkIdentifierCss(name: string) {
  const identifier: Identifier = {
    type: 'Identifier',
    name,
  };
  return identifier;
}
export function mkRawCss(value: string) {
  const identifier: Raw = {
    type: 'Raw',
    value,
  };
  return identifier;
}

export function mkNumberCss(value: number) {
  const dimension: NumberNode = {
    type: 'Number',
    value: value.toString(),
  };
  return dimension;
}

export const cssOperators = [','] as const;
export type CssOperators = typeof cssOperators[number];

export function mkOperatorCss(value: CssOperators) {
  const dimension: Operator = {
    type: 'Operator',
    value,
  };
  return dimension;
}

export function mkNewLine() {
  const nl: WhiteSpace = {
    type: 'WhiteSpace',
    value: '\n',
  };
  return nl;
}

export function mkCommentCss(value: string) {
  const comment: Comment = {
    type: 'Comment',
    value,
  };
  return comment;
}
