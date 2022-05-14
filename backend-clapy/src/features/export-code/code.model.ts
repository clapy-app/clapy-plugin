import { DeclarationPlain } from 'css-tree';
import ts from 'typescript';

import { Nil } from '../../common/general-utils';
import { Dict, ExportImageMap2, FigmaStyles } from '../sb-serialize-preview/sb-serialize.model';
import { ComponentNode2, FlexNode, GroupNode2, PageNode2, SceneNode2 } from './create-ts-compiler/canvas-utils';
import { CssRootNode } from './css-gen/css-factories-low';
import { SingleToken } from './frameworks/style-dictionary/types/types/tokens/SingleToken';

export type FigmaId = string;
export type CsbDict = Dict<{ content: string; isBinary?: boolean }>;
export type CodeDict = Dict<string>;

export type TagName = keyof JSX.IntrinsicElements;

export type JsxOneOrMore = ts.JsxChild | ts.JsxChild[];

export interface MySingleToken {
  type: SingleToken['type'];
  value: SingleToken['value'];
}

export interface ProjectContext {
  readonly compNamesAlreadyUsed: Set<string>;
  readonly assetsAlreadyUsed: Set<string>;
  readonly fontWeightUsed: Map<string, Set<number>>;
  readonly compNodes: Dict<ComponentNode2>;
  readonly components: Map<FigmaId, ModuleContext>;
  readonly resources: CodeDict;
  readonly tsFiles: CodeDict;
  readonly svgToWrite: Dict<{ svgPathVarName: string; svgContent: string }>;
  readonly cssFiles: CodeDict;
  readonly images: ExportImageMap2;
  readonly styles: FigmaStyles;
  readonly enableMUIFramework: boolean;
  readonly varNamesMap: Dict<string> | undefined;
  readonly tokensRawMap: Dict<MySingleToken> | undefined;
}

export interface ModuleContext {
  readonly projectContext: ProjectContext;
  readonly node: SceneNode2;
  readonly imports: ts.ImportDeclaration[];
  readonly statements: ts.Statement[];
  readonly pageName: string | undefined;
  readonly compDir: string;
  readonly compName: string;
  readonly classNamesAlreadyUsed: Set<string>;
  readonly subComponentNamesAlreadyUsed: Set<string>;
  readonly importsAlreadyAdded: Map<string, string>;
  readonly cssRules: CssRootNode[];
  readonly isComponent: boolean;
  // E.g. button, a... https://stackoverflow.com/a/39386695/4053349
  // Cannot really guess at project level, because components can have multiple usages.
  // Let's follow it up at component level, and review with future use cases.
  readonly inInteractiveElement?: boolean;
  readonly isRootComponent?: boolean;
  readonly classes: Set<string>;
}

export type ParentNode = FlexNode | GroupNode2 | PageNode2;

// Mutable
export interface NodeContext {
  moduleContext: ModuleContext;
  nodeNameLower: string;
  tagName: TagName;
  parentStyles: Dict<DeclarationPlain> | null;
  parentNode: ParentNode | Nil;
  parentContext: NodeContext | Nil;
  isRootNode?: boolean;
  outerLayoutOnly?: boolean;
  tranforms?: string[];
  className?: string;
}

export interface InstanceContext extends NodeContext {
  // tagName and nodeNameLower may be useless
  instanceClasses: Dict<string>;
  instanceAttributes: Dict<string>;
  componentContext: ModuleContext;
  nodeOfComp: SceneNode2;
}

export function isInstanceContext(context: NodeContext): context is InstanceContext {
  return !!(context as InstanceContext).nodeOfComp;
}

export interface BorderWidths {
  borderBottomWidth: number;
  borderLeftWidth: number;
  borderTopWidth: number;
  borderRightWidth: number;
}
