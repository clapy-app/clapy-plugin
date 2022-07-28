import type { ClassSelector, Raw } from 'css-tree';
import type ts from 'typescript';

import type { genAstFromRootNode } from '../3-gen-component.js';
import type { Dict3, ExtraConfig, UserSettings } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { CodeDict, CompAst, JsxOneOrMore, ModuleContext, NodeContext, ProjectContext } from '../code.model.js';
import type { BlockNode, SceneNode2 } from '../create-ts-compiler/canvas-utils.js';
import type { Attribute, ChildNode, Element } from '../html-gen/html-gen.js';
import { angularConnector } from './angular/index.js';
import { reactConnector } from './react/index.js';

export interface FrameworkConnector {
  templateBaseDirectory: (extraConfig: ExtraConfig) => string;
  patchSCSSInFileContents: (resources: CodeDict, extraConfig: ExtraConfig) => void;
  appCompDir: string;
  appBaseCompName: string;
  getBaseCompName: (projectContext: ProjectContext, node: SceneNode2) => string;
  getCompName: (projectContext: ProjectContext, node: SceneNode2, baseCompName: string) => string;
  getCompDirName: (baseCompName: string) => string;
  getCompFileName: (compDir: string) => string;
  cssFileNameMiddlePart: string;
  createClassAttribute: (node: SceneNode2, className: string) => ts.JsxAttribute | Attribute;
  mkSelector(context: NodeContext, className: string): Raw | ClassSelector;
  createNodeTag: (
    context: NodeContext,
    attributes: (ts.JsxAttribute | Attribute)[],
    children: ts.JsxChild[] | ChildNode[],
    node: BlockNode,
  ) => JsxOneOrMore | Element | undefined;
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
