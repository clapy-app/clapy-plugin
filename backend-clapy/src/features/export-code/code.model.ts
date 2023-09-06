import type { DeclarationPlain } from 'css-tree';
import type ts from 'typescript';

import type { Nil } from '../../common/general-utils.js';
import type {
  Dict,
  ExportImageMap2,
  ExtraConfig,
  FigmaStyles,
  PageConfig,
  SVGsExtracted,
} from '../sb-serialize-preview/sb-serialize.model.js';
import type {
  ComponentNode2,
  FlexNode,
  GroupNode2,
  InstanceNode2,
  PageNode2,
  SceneNode2,
} from './create-ts-compiler/canvas-utils.js';
import type { CssRootNode } from './css-gen/css-factories-low.js';
import type { FrameworkConnector } from './frameworks/framework-connectors.js';
import type { SingleToken } from './tech-integration/style-dictionary/types/types/tokens/SingleToken.js';

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
  readonly svgs: SVGsExtracted;
  readonly svgsRead: Map<string, string>;
  readonly images: ExportImageMap2;
  readonly styles: FigmaStyles;
  readonly enableMUIFramework: boolean;
  readonly varNamesMap: Dict<string> | undefined;
  readonly tokensRawMap: Dict<MySingleToken> | undefined;
  readonly extraConfig: ExtraConfig;
  readonly newDependencies: Dict<string>;
  readonly newDevDependencies: Dict<string>;
  readonly fwConnector: FrameworkConnector;
  readonly page: PageConfig;

  // State in the code generation progress
  wasScssRenamed?: boolean;
}

interface OverrideFromProp {
  propName: string;
}

export interface ModuleContext {
  readonly projectContext: ProjectContext;
  readonly node: SceneNode2;
  // Dictionary of imports. The key is an arbitrary key to deduplicate imports.
  // For components, it's clearly the component name. For other special imports, it's up to the developer to choose a key that would not collide with other import keys, but still help to deduplicate that specific import if required (e.g. by using the module specifier = relative path of the imported file)
  readonly imports: Dict<ts.ImportDeclaration>;
  readonly statements: ts.Statement[];
  readonly pageDir: string | undefined;
  readonly compDir: string;
  readonly compName: string;
  readonly baseCompName: string;
  readonly classNamesAlreadyUsed: Set<string>;
  // In a component, lists the nodes for which a prop can override the class. It is used to generate the list of props in the component source.
  readonly classOverrides: Set<string>;
  readonly swaps: Set<string>;
  readonly subComponentNamesAlreadyUsed: Set<string>;
  readonly importsAlreadyAdded: Map<string, string>;
  readonly cssRules: CssRootNode[];
  readonly isComponent: boolean;
  readonly isEmbeddedComponent: boolean;
  // E.g. button, a... https://stackoverflow.com/a/39386695/4053349
  // Cannot really guess at project level, because components can have multiple usages.
  // Let's follow it up at component level, and review with future use cases.
  readonly inInteractiveElement?: boolean;
  readonly isRootComponent?: boolean;
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
  parentIsRootInComponent?: boolean;
  outerLayoutOnly?: boolean;
  tranforms?: string[];
  boxShadows?: string[];
  margins?: Margins;
  transformTranslateX?: string;
  transformTranslateY?: string;
  className?: string;
  overriddenContext?: NodeContext;
  // Provided for instances (interface below). It is added here as an optional field so that
  // when writing style, we can have a different behavior depending on the original component styles
  nodeOfComp?: SceneNode2;
  notOverridingAnotherClass?: boolean;
  firstChildIsPlaceholder?: boolean;
  selector?: string;
  hasExtraAttributes?: boolean;
  mustReverseOrder?: boolean;
}

export type TextOValue = JsxOneOrMore | string | false;

export type CompAst = ts.JsxExpression | ts.JsxSelfClosingElement | ts.JsxFragment;

export interface BaseFigmaOverride<T> {
  overrideValue?: T;
  propValue?: string;
}

// This interface can be cleaned up after we ensured we don't need some of the nodes.
// They are useful for debugging, though.
export interface FigmaOverride<T> extends BaseFigmaOverride<T> {
  intermediateNode: SceneNode2;
  propName: string;
}

export type StyleOverride = FigmaOverride<string>;
export type BaseStyleOverride = BaseFigmaOverride<string>;

export type SwapAst = JsxOneOrMore;
export type SwapOverride = FigmaOverride<SwapAst>;

export type HideOverride = FigmaOverride<boolean>;

export type TextOverride = FigmaOverride<JsxOneOrMore>;

export interface OverrideProps {
  instanceNodeOfComp: SceneNode2; // For debug only - to remove later?
  propValue: string;
}

export interface CompContext {
  // Lists the override values for the nodes inside the instance. Will be used to pass the value to the corresponding prop when writing the code (props on instance). It is a dictionary to deduplicate by target node ID. (same as deduplicating by class, but safer to identify bugs when developing)
  instanceStyleOverrides: Dict<StyleOverride>;
  instanceHidings: Dict<HideOverride>;
  instanceSwaps: Dict<SwapOverride>;
  instanceTextOverrides: Dict<TextOverride>;
}

export interface IntermediateComponent {
  componentContext: ModuleContext;
  // instance node for this component
  node: SceneNode2;
}

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
  inheritedStyles?: Dict<DeclarationPlain>;
  // intermediateComponents: IntermediateComponent[];
  // When adding properties here, ensure you also update the InstanceContext creation in 4- and 5-instance-overrides.ts.
  // TypeScript won't mark errors, because it inherits the previous context properties.
  // (To change?)
  swapContext?: SwapContext | undefined;
}

export interface SwapContext {
  intermediateInstanceNodeOfComps: InstanceContext['intermediateInstanceNodeOfComps'];
  intermediateComponentContexts: InstanceContext['intermediateComponentContexts'];
  intermediateNodes: InstanceContext['intermediateNodes'];
}

export function isInstanceContext(context: NodeContext): context is InstanceContext {
  return !!(context as InstanceContext).componentContext;
}

export interface BorderWidths {
  borderBottomWidth: number;
  borderLeftWidth: number;
  borderTopWidth: number;
  borderRightWidth: number;
}

export interface Margins {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}
