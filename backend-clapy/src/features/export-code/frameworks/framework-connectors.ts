import type { ClassSelector, DeclarationPlain, Raw } from 'css-tree';
import type { Attribute } from 'parse5/dist/common/token.js';
import type { ChildNode, Element } from 'parse5/dist/tree-adapters/default';
import type ts from 'typescript';

import type { genAstFromRootNode } from '../3-gen-component.js';
import type { Nil } from '../../../common/general-utils.js';
import type { Dict, Dict3, ExtraConfig, UserSettings } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { CompAst, JsxOneOrMore, ModuleContext, NodeContext, ParentNode, ProjectContext } from '../code.model.js';
import type { BlockNode, SceneNode2, ValidNode } from '../create-ts-compiler/canvas-utils.js';
import { angularConnector } from './angular/index.js';
import { reactConnector } from './react/index.js';

export type FwNode = ts.JsxChild | ChildNode;
export type FwNodeOneOrMore = FwNode | FwNode[];
export type FwAttr = ts.JsxAttribute | Attribute;

export interface FrameworkConnector {
  templateBaseDirectory: (extraConfig: ExtraConfig) => string;
  getIndexHtmlPath: (extraConfig: ExtraConfig) => string;
  enableInstanceOverrides: boolean;
  patchProjectConfigFiles: (projectContext: ProjectContext, extraConfig: ExtraConfig) => void;
  appCompDir: string;
  appBaseCompName: string;
  getBaseCompName: (projectContext: ProjectContext, node: SceneNode2) => string;
  getCompName: (projectContext: ProjectContext, node: SceneNode2, baseCompName: string) => string;
  getCompDirName: (baseCompName: string) => string;
  getCompFileName: (compDir: string) => string;
  cssFileNameMiddlePart: string;
  // Both variables must be consistent.
  assetsResourceDir: string;
  // Here, '', '/' or '.' points to the public directory.
  assetsCssBaseUrl: string;
  webpackIgnoreInCSS: boolean;
  addScssPackages: (newDevDependencies: Dict<string>) => void;
  registerSvgForWrite: (context: NodeContext, svgContent: string) => string;
  createClassAttribute: (node: SceneNode2, extraConfig: ExtraConfig, className: string) => FwAttr;
  createClassAttributeSimple: (className: string) => FwAttr;
  createClassAttrForClassNoOverride: (className: string, extraConfig: ExtraConfig) => FwAttr;
  mkSelector(context: NodeContext, className: string, customSelector: string | undefined): Raw | ClassSelector;
  createNodeTag: (
    context: NodeContext,
    attributes: FwAttr[],
    children: (ts.JsxChild | ChildNode)[],
    node: BlockNode,
  ) => JsxOneOrMore | Element | ChildNode[] | undefined;
  mkSwapInstanceAlone: (context: NodeContext, ast: FwNodeOneOrMore | undefined, node: SceneNode2) => FwNode;
  wrapHideAndTextOverride: <T extends boolean>(
    context: NodeContext,
    ast: FwNodeOneOrMore | undefined,
    node: SceneNode2,
    isJsExprAllowed: T,
  ) => T extends true
    ? FwNodeOneOrMore | ts.BinaryExpression | ts.ConditionalExpression | undefined
    : FwNodeOneOrMore | undefined;
  createText: (text: string) => FwNodeOneOrMore;
  createLinkAttributes: (href: string) => FwAttr[];
  createInputTypeAttr: (value: string) => FwAttr;
  wrapNode: (
    context: NodeContext,
    node: FwNodeOneOrMore,
    tagName: string,
    attributes: FwAttr[],
    isNodeTag?: boolean,
  ) => FwNode;
  writeFileCode: (ast: ReturnType<typeof genAstFromRootNode>, moduleContext: ModuleContext) => void;
  genCompUsage: (
    projectContext: ProjectContext,
    node: SceneNode2,
    extraAttributes?: FwAttr[],
  ) => CompAst | Element | undefined;
  createSvgTag: (svgPathVarName: string, svgAttributes: FwAttr[]) => FwNode;
  addExtraSvgAttributes: (context: NodeContext, node: ValidNode, svgStyles: Dict<DeclarationPlain>) => void;
  writeRootCompFileCode: (
    appModuleContext: ModuleContext,
    compAst: CompAst | Element | undefined,
    appCssPath: string,
    parent: ParentNode | Nil,
  ) => void;
  writeSVGReactComponents: (projectContext: ProjectContext) => Promise<void>;
  cleanUpProject: (projectContext: ProjectContext) => void;
}

export const frameworkConnectors = makeConnectors({
  react: reactConnector,
  angular: angularConnector,
});

// Wrapper to improve typing: the argument gets constrainted, and the output type is what is written as input (instead of the constraint itself).
// I.e. the output type will be { react: ..., angular: ... } instead of Dict3<..., ...>.
function makeConnectors<T extends Dict3<NonNullable<UserSettings['framework']>, FrameworkConnector>>(connectors: T) {
  return connectors;
}
