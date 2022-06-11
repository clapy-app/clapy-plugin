import { DeclarationPlain } from 'css-tree';
import ts from 'typescript';

import { Nil } from '../../common/general-utils';
import { Dict, Dict3, ExportImageMap2, ExtraConfig, FigmaStyles } from '../sb-serialize-preview/sb-serialize.model';
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
  /** @deprecated use `components` instead, then read the node. Bot for now, compNodes seems to contain more nodes than components. Maybe component nodes of components that haven't been generated yet? */
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

interface CompClassOverride {
  propName: string;
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
  // In a component, lists the nodes for which a prop can override the class. It is used to generate the list of props in the component source.
  readonly classOverrides: Dict3<FigmaId, CompClassOverride>;
  readonly subComponentNamesAlreadyUsed: Set<string>;
  readonly importsAlreadyAdded: Map<string, string>;
  readonly cssRules: CssRootNode[];
  readonly isComponent: boolean;
  // E.g. button, a... https://stackoverflow.com/a/39386695/4053349
  // Cannot really guess at project level, because components can have multiple usages.
  // Let's follow it up at component level, and review with future use cases.
  readonly inInteractiveElement?: boolean;
  readonly isRootComponent?: boolean;
  readonly swappableInstances: Set<string>;
  readonly hideProps: Set<string>;
  readonly textOverrideProps: Set<string>;
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

export type HidingValue = boolean | string;
export type SwapValue = SwapAst | string | false;
export type TextOValue = JsxOneOrMore | string | false;
type InstanceNodeId = string;

export interface BaseStyleOverride {
  overrideValue?: string;
  propValue?: string;
}

// This interface can be cleaned up after we ensured we don't need some of the nodes.
// They are useful for debugging, though.
export interface StyleOverride extends BaseStyleOverride {
  isRootNodeOverride: boolean;
  intermediateNode: SceneNode2;
  propName: string;
}

export interface OverrideProps {
  instanceNodeOfComp: SceneNode2; // For debug only - to remove later?
  propValue: string;
}

export interface CompContext {
  // Lists the override values for the nodes inside the instance. Will be used to pass the value to the corresponding prop when writing the code (props on instance). It is a dictionary to deduplicate by target node ID. (same as deduplicating by class, but safer to identify bugs when developing)
  instanceStyleOverrides: Dict3<InstanceNodeId, StyleOverride>;
  instanceHidings: Dict<HidingValue>;
  instanceSwaps: Dict<SwapValue>;
  instanceTextOverrides: Dict<TextOValue>;
  mappingDone?: boolean;
}

export interface IntermediateComponent {
  componentContext: ModuleContext;
  // instance node for this component
  node: SceneNode2;
}

export type SwapAst = ts.JsxSelfClosingElement | ts.JsxExpression;

export interface InstanceContext extends NodeContext {
  // tagName and nodeNameLower may be useless
  // nodeOfComp in parent component = on the instance node of the "parent", before we go through genInstanceOverrides()
  instanceNode: ComponentNode2 | InstanceNode2;
  // In a sub-instance, the instance node on the final component may not be the instance node we are parsing.
  // Ex page > card > button, when parsing the page, the button instance node (read to check overrides only) is not the same as the button instance when parsing the card (to generate the card code).
  instanceNodeOfComp: ComponentNode2 | InstanceNode2;
  componentContext: ModuleContext;
  nodeOfComp: SceneNode2;
  intermediateInstanceNodeOfComps: (ComponentNode2 | InstanceNode2)[];
  intermediateComponentContexts: ModuleContext[];
  // Undefined when a component is swapped. No need to match with the other instance, it may not have the same structure.
  intermediateNodes: (SceneNode2 | undefined)[];
  // intermediateComponents: IntermediateComponent[];
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
