import { DeclarationPlain } from 'css-tree';
import { Project, SourceFile, ts } from 'ts-morph';

import { Dict, ExportImageMap2 } from '../sb-serialize-preview/sb-serialize.model';
import { FlexNode, GroupNode2, PageNode2 } from './create-ts-compiler/canvas-utils';
import { CssRootNode } from './css-gen/css-factories-low';

export type CsbDict = Dict<{ content: string; isBinary?: boolean }>;
export type CodeDict = Dict<string>;

export type TagName = keyof JSX.IntrinsicElements;

export type JsxOneOrMore = ts.JsxChild | ts.JsxChild[];

export interface ProjectContext {
  readonly compNamesAlreadyUsed: Set<string>;
  readonly assetsAlreadyUsed: Set<string>;
  readonly fontWeightUsed: Map<string, Set<number>>;
  readonly project: Project;
  readonly resources: CodeDict;
  readonly cssFiles: CodeDict;
  readonly images: ExportImageMap2;
}

export interface ComponentContext {
  readonly projectContext: ProjectContext;
  readonly file: SourceFile;
  readonly pageName: string | undefined;
  readonly compDir: string;
  readonly compName: string;
  readonly classNamesAlreadyUsed: Set<string>;
  readonly importNamesAlreadyUsed: Set<string>;
  readonly cssRules: CssRootNode[];
  // E.g. button, a... https://stackoverflow.com/a/39386695/4053349
  // Cannot really guess at project level, because components can have multiple usages.
  // Let's follow it up at component level, and review with future use cases.
  readonly inInteractiveElement?: boolean;
}

export type ParentNode = FlexNode | GroupNode2 | PageNode2;

// Mutable
export interface NodeContext {
  componentContext: ComponentContext;
  nodeNameLower: string;
  tagName: TagName;
  parentStyles: Dict<DeclarationPlain> | null;
  parentNode: ParentNode | null;
  parentContext: NodeContextOptionalBorders | null;
  isPageLevel?: boolean;
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

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type NodeContextOptionalBorders = Optional<NodeContextWithBorders, 'borderWidths'>;
