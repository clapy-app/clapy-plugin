import { DeclarationPlain } from 'css-tree';
import ts from 'typescript';

import { Nil } from '../../common/general-utils';
import { Dict, ExportImageMap2, ExtraConfig, FigmaStyles } from '../sb-serialize-preview/sb-serialize.model';
import {
  ComponentNode2,
  FlexNode,
  GroupNode2,
  InstanceNode2,
  PageNode2,
  SceneNode2,
} from './create-ts-compiler/canvas-utils';
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
  /** @deprecated use `components` instead, then read the node */
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
  readonly extraConfig: ExtraConfig;
}

export interface ModuleContext {
  readonly projectContext: ProjectContext;
  readonly node: SceneNode2;
  readonly parent: ParentNode | Nil;
  // Dictionary of imports. The key is an arbitrary key to deduplicate imports.
  // For components, it's clearly the component name. For other special imports, it's up to the developer to choose a key that would not collide with other import keys, but still help to deduplicate that specific import if required (e.g. by using the module specifier = relative path of the imported file)
  readonly imports: Dict<ts.ImportDeclaration>;
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
  readonly swappableInstances: Set<string>;
  readonly hideProps: Set<string>;
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
  isRootInComponent: boolean;
  isRootNode?: boolean;
  outerLayoutOnly?: boolean;
  tranforms?: string[];
  className?: string;
  overriddenContext?: NodeContext;
  // Provided for instances (interface below). It is added here as an optional field so that
  // when writing style, we can have a different behavior depending on the original component styles
  nodeOfComp?: SceneNode2;
}

export interface CompContext {
  instanceClassesForStyles: Dict<string>; // TODO rename instanceClasses, and its usages
  instanceClassesForProps: Dict<string>; // TODO delete
  instanceHidings: Dict<boolean | string>;
  instanceSwaps: Dict<SwapAst | string | false>;
  mappingDone?: boolean;
}

export type SwapAst = ts.JsxSelfClosingElement | ts.JsxExpression;

export interface InstanceContext extends NodeContext {
  // tagName and nodeNameLower may be useless
  // nodeOfComp in parent component = on the instance node of the "parent", before we go through genInstanceOverrides()
  instanceNode: ComponentNode2 | InstanceNode2;
  componentContext: ModuleContext;
  nodeOfComp: SceneNode2;
  // When adding properties here, ensure you also update the InstanceContext creation in 4- and 5-instance-overrides.ts.
  // TypeScript won't mark errors, because it inherits the previous context properties.
  // (To change?)
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
