import { DeclarationPlain } from 'css-tree';
import { ts } from 'ts-morph';

import { Dict } from '../sb-serialize-preview/sb-serialize.model';
import { FlexNode } from './create-ts-compiler/canvas-utils';
import { CssRootNode } from './css-gen/css-factories-low';

export type CsbDict = Dict<{ content: string }>;
export type CodeDict = Dict<string>;

export type TagName = keyof JSX.IntrinsicElements;

export type JsxOneOrMore = ts.JsxChild | ts.JsxChild[];

export interface CodeContext {
  cssRules: CssRootNode[];
  classNamesAlreadyUsed: Set<string>;
  compNamesAlreadyUsed: Set<string>;
  tagName: TagName;
  inButton?: boolean;
  parentStylesMap?: Dict<DeclarationPlain>;
  parentNode?: FlexNode;
}

export interface BorderWidths {
  borderBottomWidth: number;
  borderLeftWidth: number;
  borderTopWidth: number;
  borderRightWidth: number;
}

export interface CodeContextWithBorders extends CodeContext {
  borderWidths: BorderWidths;
}
