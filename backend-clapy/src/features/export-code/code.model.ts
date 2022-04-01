import { DeclarationPlain } from 'css-tree';
import { ts } from 'ts-morph';

import { Dict } from '../sb-serialize-preview/sb-serialize.model';
import { FlexNode } from './create-ts-compiler/canvas-utils';
import { CssRootNode } from './css-gen/css-factories-low';

export type CsbDict = Dict<{ content: string }>;
export type CodeDict = Dict<string>;

export type TagName = keyof JSX.IntrinsicElements;

export type JsxOneOrMore = ts.JsxChild | ts.JsxChild[];

export interface ProjectContext {
  readonly compNamesAlreadyUsed: Set<string>;
}

export interface ComponentContext {
  readonly projectContext: ProjectContext;
  readonly classNamesAlreadyUsed: Set<string>;
  readonly cssRules: CssRootNode[];
  // E.g. button, a... https://stackoverflow.com/a/39386695/4053349
  // Cannot really guess at project level, because components can have multiple usages.
  // Let's follow it up at component level, and review with future use cases.
  readonly inInteractiveElement?: boolean;
}

// Mutable
export interface NodeContext {
  componentContext: ComponentContext;
  tagName: TagName;
  parentStyles: Dict<DeclarationPlain> | null;
  parentNode: FlexNode | null;
  parentContext: NodeContextWithBorders | null;
}

export interface BorderWidths {
  borderBottomWidth: number;
  borderLeftWidth: number;
  borderTopWidth: number;
  borderRightWidth: number;
}

export interface NodeContextWithBorders extends NodeContext {
  borderWidths: BorderWidths;
}
