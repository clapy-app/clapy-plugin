import type { ClassSelector, Raw } from 'css-tree';
import type { Attribute } from 'parse5/dist/common/token.js';
import type { ChildNode, Element, TextNode } from 'parse5/dist/tree-adapters/default';
import type ts from 'typescript';

import type { genAstFromRootNode } from '../3-gen-component.js';
import type { Dict3, ExtraConfig, UserSettings } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { CodeDict, CompAst, JsxOneOrMore, ModuleContext, NodeContext, ProjectContext } from '../code.model.js';
import type { BlockNode, SceneNode2 } from '../create-ts-compiler/canvas-utils.js';
import { angularConnector } from './angular/index.js';
import { reactConnector } from './react/index.js';

export type FwNode = ts.JsxChild | ChildNode;
export type FwNodeOneOrMore = FwNode | FwNode[];

export interface FrameworkConnector {
  templateBaseDirectory: (extraConfig: ExtraConfig) => string;
  getIndexHtmlPath: (extraConfig: ExtraConfig) => string;
  enableInstanceOverrides: boolean;
  patchSCSSInFileContents: (resources: CodeDict, extraConfig: ExtraConfig) => void;
  appCompDir: string;
  appBaseCompName: string;
  getBaseCompName: (projectContext: ProjectContext, node: SceneNode2) => string;
  getCompName: (projectContext: ProjectContext, node: SceneNode2, baseCompName: string) => string;
  getCompDirName: (baseCompName: string) => string;
  getCompFileName: (compDir: string) => string;
  cssFileNameMiddlePart: string;
  createClassAttribute: (node: SceneNode2, className: string) => ts.JsxAttribute | Attribute;
  createClassAttrForClassNoOverride: (className: string) => ts.JsxAttribute | Attribute;
  mkSelector(context: NodeContext, className: string): Raw | ClassSelector;
  createNodeTag: (
    context: NodeContext,
    attributes: (ts.JsxAttribute | Attribute)[],
    children: (ts.JsxChild | ChildNode)[],
    node: BlockNode,
  ) => JsxOneOrMore | Element | ChildNode[] | undefined;
  wrapHideAndTextOverride: (
    context: NodeContext,
    ast: FwNodeOneOrMore | undefined,
    node: SceneNode2,
  ) => FwNodeOneOrMore | undefined;
  createText: (text: string) => ts.JsxText | TextNode;
  createLinkAttributes: (href: string) => (ts.JsxAttribute | Attribute)[];
  wrapNode: (node: FwNodeOneOrMore, tagName: string, attributes: (ts.JsxAttribute | Attribute)[]) => FwNode;
  writeFileCode: (ast: ReturnType<typeof genAstFromRootNode>, moduleContext: ModuleContext) => void;
  genCompUsage: (projectContext: ProjectContext, node: SceneNode2) => CompAst | Element | undefined;
  writeRootCompFileCode: (appModuleContext: ModuleContext, compAst: CompAst | Element | undefined) => void;
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