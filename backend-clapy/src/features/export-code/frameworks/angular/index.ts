import type { Attribute } from 'parse5/dist/common/token.js';
import type { ChildNode, Node } from 'parse5/dist/tree-adapters/default.js';

import { dashCaseToPascalCase, isNonEmptyObject } from '../../../../common/general-utils.js';
import { exportTemplatesDir } from '../../../../root.js';
import type { AngularConfig } from '../../../sb-serialize-preview/sb-serialize.model.js';
import type { ModuleContext, ProjectContext } from '../../code.model.js';
import type { SceneNode2 } from '../../create-ts-compiler/canvas-utils.js';
import { cssAstToString, mkClassSelectorCss, mkRawCss } from '../../css-gen/css-factories-low.js';
import { getComponentName, TextCase } from '../../gen-node-utils/gen-unique-name-utils.js';
import { printTsStatements } from '../../gen-node-utils/ts-print.js';
import { mkHtmlAttribute, mkHtmlElement, mkHtmlText, serializeHtml } from '../../html-gen/html-gen.js';
import { getCSSExtension } from '../../tech-integration/scss/scss-utils.js';
import type { FrameworkConnector } from '../framework-connectors.js';
import { getComponentTsAst } from './component-ts-ast.js';
import { getModuleTsAst } from './module-ts-ast.js';
import { patchSCSSInFileContents } from './scss.js';

const csbDir = `${exportTemplatesDir}/angular-csb`;
const zipDir = `${exportTemplatesDir}/angular-zip`;

export const angularConnector: FrameworkConnector = {
  templateBaseDirectory: extraConfig => (extraConfig.useZipProjectTemplate ? zipDir : csbDir),
  getIndexHtmlPath: () => 'src/index.html',
  enableInstanceOverrides: false,
  patchSCSSInFileContents,
  appCompDir: 'src/app',
  appBaseCompName: 'app',
  // my-rectangle
  getBaseCompName: (projectContext, node) => getComponentName(projectContext, node, TextCase.Dash),
  // MyRectangleComponent
  getCompName: (projectContext, node, baseCompName) => `${dashCaseToPascalCase(baseCompName)}Component`,
  // my-rectangle
  getCompDirName: (baseCompName: string) => baseCompName,
  // my-rectangle.component.ts
  getCompFileName: compDir => `${compDir}.component.ts`,
  cssFileNameMiddlePart: 'component',
  createClassAttribute(node, className) {
    const className2 = className || node.className!;
    return mkHtmlAttribute('class', className2);
  },
  createClassAttrForClassNoOverride: className => mkHtmlAttribute('class', className),
  mkSelector: (context, className) =>
    !context.hasExtraAttributes && className === 'root' ? mkRawCss(':host') : mkClassSelectorCss(className),
  createNodeTag: (context, attributes, children, node) => {
    const { isRootInComponent } = context;
    if (isRootInComponent && !context.hasExtraAttributes) {
      return children as ChildNode[];
    }
    return mkHtmlElement(context.tagName, attributes as Attribute[], children as ChildNode[]);
  },
  wrapHideAndTextOverride: (context, ast, node) => ast,
  createText: mkHtmlText,
  createLinkAttributes: href => [
    mkHtmlAttribute('href', href),
    mkHtmlAttribute('target', '_blank'),
    mkHtmlAttribute('rel', 'noreferrer'),
  ],
  wrapNode: (node, tagName, attributes) =>
    mkHtmlElement(tagName, attributes as Attribute[], node as ChildNode | ChildNode[]),
  writeFileCode: (ast, moduleContext) => {
    const { projectContext, compDir, baseCompName, imports } = moduleContext;
    const { cssFiles } = projectContext;

    const [tsx, css] = ast;

    const path = `${compDir}/${baseCompName}.component.html`;
    const htmlStr = tsx ? serializeHtml(tsx as Node) : '';
    projectContext.resources[path] = htmlStr;

    if (isNonEmptyObject(css.children)) {
      const cssExt = getCSSExtension(projectContext.extraConfig);
      const cssFileName = `${baseCompName}.component.${cssExt}`;
      cssFiles[`${compDir}/${cssFileName}`] = cssAstToString(css);
      // const cssModuleModuleSpecifier = `./${cssFileName}`;
      // imports[cssModuleModuleSpecifier] = mkDefaultImportDeclaration('classes', cssModuleModuleSpecifier);
    }

    printFileInProject(moduleContext);
  },
  genCompUsage,
  writeRootCompFileCode(appModuleContext, compAst) {
    const { projectContext, compDir, baseCompName } = appModuleContext;

    const path = `${compDir}/${baseCompName}.component.html`;
    const htmlStr = serializeHtml(compAst as Node);
    projectContext.resources[path] = htmlStr;

    const modulePath = `${compDir}/app.module.ts`;
    projectContext.tsFiles[modulePath] = printTsStatements(getModuleTsAst(appModuleContext));
  },
};

function printFileInProject(moduleContext: ModuleContext) {
  const { projectContext, compDir, baseCompName } = moduleContext;

  const path = `${compDir}/${baseCompName}.component.ts`;
  projectContext.tsFiles[path] = printTsStatements(getComponentTsAst(moduleContext));
}

export function genCompUsage(projectContext: ProjectContext, node: SceneNode2) {
  const { componentContext } = node;
  if (!componentContext) {
    throw new Error(
      `node ${node.name} should be an instance with componentContext attribute. But componentContext is undefined.`,
    );
  }
  const { prefix } = projectContext.extraConfig.frameworkConfig as AngularConfig;
  if (!prefix) throw new Error(`Angular prefix undefined, cannot generate component usage.`);
  return mkHtmlElement(`${prefix}-${componentContext.baseCompName}`);
}