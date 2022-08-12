import type { Attribute } from 'parse5/dist/common/token.js';
import type { ChildNode, Node } from 'parse5/dist/tree-adapters/default.js';

import { isNonEmptyObject } from '../../../../common/general-utils.js';
import { env } from '../../../../env-and-config/env.js';
import { exportTemplatesDir } from '../../../../root.js';
import type { ExtraConfig } from '../../../sb-serialize-preview/sb-serialize.model.js';
import type { ModuleContext, NodeContext, ProjectContext } from '../../code.model.js';
import type { FlexNode, SceneNode2 } from '../../create-ts-compiler/canvas-utils.js';
import { resetsCssModulePath } from '../../create-ts-compiler/load-file-utils-and-paths.js';
import { addStyle } from '../../css-gen/css-factories-high.js';
import { cssAstToString, mkClassSelectorCss, mkRawCss } from '../../css-gen/css-factories-low.js';
import {
  dashCaseToPascalCase,
  genIconComponentImportName,
  getComponentName,
  TextCase,
} from '../../gen-node-utils/gen-unique-name-utils.js';
import { printTsStatements } from '../../gen-node-utils/ts-print.js';
import { mkHtmlAttribute, mkHtmlElement, mkHtmlText, serializeHtml } from '../../html-gen/html-gen.js';
import { getCSSExtension, getCssResetsPath } from '../../tech-integration/scss/scss-utils.js';
import type { FrameworkConnector, FwAttr } from '../framework-connectors.js';
import { getComponentTsAst } from './component-ts-ast.js';
import { getModuleTsAst } from './module-ts-ast.js';

const csbDir = `${exportTemplatesDir}/angular-csb`;
const zipDir = `${exportTemplatesDir}/angular-zip`;
const appCompDir = 'src/app';
const assetsDir = 'src/assets';
const indexHtmlPath = 'src/index.html';

export const angularConnector: FrameworkConnector = {
  templateBaseDirectory: extraConfig => (extraConfig.useZipProjectTemplate ? zipDir : csbDir),
  getIndexHtmlPath: () => indexHtmlPath,
  enableInstanceOverrides: false,
  patchProjectConfigFiles,
  appCompDir,
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
  assetsResourceDir: 'src/assets/',
  assetsCssBaseUrl: '/assets/',
  webpackIgnoreInCSS: false,
  addScssPackages: () => {},
  patchCssResets: projectContext => {
    const { cssFiles } = projectContext;
    // In Angular, always delete the CSS module file.
    delete cssFiles[resetsCssModulePath];
  },
  registerSvgForWrite,
  createClassAttribute(node, extraConfig, className) {
    const className2 = className || node.className!;
    return mkHtmlAttribute('class', className2);
  },
  createClassAttributeSimple: className => mkHtmlAttribute('class', className),
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
  mkSwapInstanceAlone: (context, ast, node) => {
    if (!ast) throw new Error('BUG AST is undefined');
    if (Array.isArray(ast)) throw new Error('BUG AST is an array');
    return ast;
  },
  wrapHideAndTextOverride: (context, ast, node, isJsExprAllowed) => ast,
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
    const { cssFiles, cssResetRules } = projectContext;

    const [tsx, css] = ast;

    const path = `${compDir}/${baseCompName}.component.html`;
    const htmlStr = tsx ? serializeHtml(tsx as Node) : '';
    projectContext.resources[path] = htmlStr;

    let cssStr = `:host, * { ${cssResetRules} }`;

    const hasCss = isNonEmptyObject(css.children);
    if (hasCss) {
      cssStr += `\n${cssAstToString(css)}`;
    }
    const cssExt = getCSSExtension(projectContext.extraConfig);
    const cssFileName = `${baseCompName}.component.${cssExt}`;
    cssFiles[`${compDir}/${cssFileName}`] = cssStr;

    printFileInProject(moduleContext, undefined, hasCss, false);
  },
  genCompUsage,
  createSvgTag,
  addExtraSvgAttributes: (context, node, svgStyles) => addStyle(context, node, svgStyles, 'object-fit', 'cover'),
  writeRootCompFileCode(appModuleContext, compAst, appCssPath, parent) {
    const { projectContext, compDir, baseCompName } = appModuleContext;

    const path = `${compDir}/${baseCompName}.component.html`;
    const htmlStr = serializeHtml(compAst as Node);
    projectContext.resources[path] = htmlStr;

    const modulePath = `${compDir}/${baseCompName}.module.ts`;
    projectContext.tsFiles[modulePath] = printTsStatements(getModuleTsAst(appModuleContext));

    const { angularPrefix } = projectContext.extraConfig;
    printFileInProject(appModuleContext, `${angularPrefix}-root`, false, true);

    // If the parent node is vertical, add a flex-direction: column to the root.
    if ((parent as FlexNode | undefined)?.layoutMode === 'VERTICAL') {
      const { cssFiles } = projectContext;
      const stylesCssPath = getStylesCssPath(projectContext);

      cssFiles[stylesCssPath] = cssFiles[stylesCssPath].replace(
        new RegExp(`(${angularPrefix}-root\\s*\\{[^\\}]*)\\}`),
        '$1;flex-direction:column}',
      );
    }
  },
  writeSVGReactComponents: async () => {},
};

function patchProjectConfigFiles(projectContext: ProjectContext, extraConfig: ExtraConfig) {
  const { resources, cssFiles } = projectContext;
  const angularJson = JSON.parse(resources['angular.json']);
  const proj = angularJson.projects[Object.keys(angularJson.projects)[0]];
  if (extraConfig.scss && extraConfig.useZipProjectTemplate) {
    proj.schematics = {
      '@schematics/angular:component': {
        style: 'scss',
      },
    };
    proj.architect.build.options.inlineStyleLanguage = 'scss';
    proj.architect.test.options.inlineStyleLanguage = 'scss';
  }

  const resetsCssPath = getCssResetsPath(extraConfig);
  const stylesCssPath = getStylesCssPath(projectContext);
  proj.architect.build.options.styles.push(resetsCssPath);
  proj.architect.test.options.styles.push(resetsCssPath);

  const { angularPrefix } = extraConfig;
  if (angularPrefix !== 'app') {
    proj.prefix = angularPrefix;
    if (!resources[indexHtmlPath]) throw new Error(`index.html not found at ${indexHtmlPath}`);
    resources[indexHtmlPath] = resources[indexHtmlPath].replace(
      '<app-root></app-root>',
      `<${angularPrefix}-root></${angularPrefix}-root>`,
    );
    if (!cssFiles[resetsCssPath]) throw new Error(`CSS resets not found at ${resetsCssPath}`);
    cssFiles[resetsCssPath] = cssFiles[resetsCssPath].replaceAll('app-root', `${angularPrefix}-root`);
    if (!cssFiles[stylesCssPath]) throw new Error(`CSS resets not found at ${stylesCssPath}`);
    cssFiles[stylesCssPath] = cssFiles[stylesCssPath].replaceAll('app-root', `${angularPrefix}-root`);
  }

  if (env.isDev) {
    // Disable the analytics prompt locally, to avoid blocking the preview task.
    angularJson.cli.analytics = false;
  }

  if (extraConfig.output !== 'csb') {
    // Legacy config that is required on CodeSandbox.
    delete angularJson.defaultProject;
  }

  resources['angular.json'] = JSON.stringify(angularJson, null, 2);
}

export function registerSvgForWrite(context: NodeContext, svgContent: string) {
  const { moduleContext } = context;
  const { projectContext } = moduleContext;

  const svgPathVarName = genIconComponentImportName(context, TextCase.Dash, true);

  // For Angular, the SVG is saved as an asset and will be used in an img tag as href. No need to wrap into a component, as we do in React.
  projectContext.resources[`${assetsDir}/${svgPathVarName}.svg`] = svgContent;

  return svgPathVarName;
}

function printFileInProject(
  moduleContext: ModuleContext,
  compNameOverride: string | undefined,
  hasCss: boolean,
  skipAnnotation: boolean,
) {
  const { projectContext, compDir, baseCompName } = moduleContext;

  const path = `${compDir}/${baseCompName}.component.ts`;
  projectContext.tsFiles[path] = printTsStatements(
    getComponentTsAst(moduleContext, compNameOverride, hasCss, skipAnnotation),
  );
}

function genCompUsage(projectContext: ProjectContext, node: SceneNode2) {
  const { componentContext } = node;
  if (!componentContext) {
    throw new Error(
      `node ${node.name} should be an instance with componentContext attribute. But componentContext is undefined.`,
    );
  }
  const { angularPrefix } = projectContext.extraConfig;
  if (!angularPrefix) throw new Error(`Angular prefix undefined, cannot generate component usage.`);
  return mkHtmlElement(`${angularPrefix}-${componentContext.baseCompName}`);
}

function createSvgTag(svgPathVarName: string, svgAttributes?: FwAttr[]) {
  const imgSrcAttr = mkHtmlAttribute('src', `assets/${svgPathVarName}.svg`);
  const imgAltAttr = mkHtmlAttribute('alt', ``);
  return mkHtmlElement(`img`, [imgSrcAttr, imgAltAttr, ...(svgAttributes as Attribute[])]);
}

function getStylesCssPath(projectContext: ProjectContext) {
  const { extraConfig } = projectContext;
  const cssExt = getCSSExtension(extraConfig);
  return `src/styles.${cssExt}`;
}

// function mergeHostWithResetRules(css: StyleSheetPlain, cssResetStr: string) {
//   let hostRule = css.children.find(child => {
//     if (child.type !== 'Rule') return false;
//     const { prelude } = child;
//     if (prelude.type !== 'SelectorList' || prelude.children.length !== 1) return false;
//     const sel = prelude.children[0];
//     if (sel.type !== 'Selector' || sel.children.length !== 1) return false;
//     const style = sel.children[0];
//     return style.type === 'Raw' && style.value === ':host';
//   }) as RulePlain | undefined;
//   if (!hostRule) {
//     hostRule = mkRuleCss(mkRawCss(':host'), mkBlockCss([]));
//     css.children.unshift(hostRule);
//   }
//   // After slightly complex navigation in CSS AST, we have extracted the list of style declarations for :host
//   const hostDeclarations = hostRule.block.children as DeclarationPlain[];
//   // We index them to check later the rules already defined in the component
//   const stylesHost = listToStyles(hostDeclarations);
//
//   // We read the CSS rules, parsed as AST, to merge.
//   // Optimization: calculate only once per project, or even globally. The CSS reset rules are always the same.
//   const cssResetStylesheet = csstree.toPlainObject(csstree.parse(cssResetStr));
//   const styleDeclReset = ((cssResetStylesheet as StyleSheetPlain).children[0] as RulePlain).block
//     .children as DeclarationPlain[];
//
//   // Then we merge. We preseve only the reset rules that are not already defined in the component :host.
//   const hostMergedDeclarations: DeclarationPlain[] = [
//     ...styleDeclReset.filter(decl => !stylesHost[decl.property]),
//     ...hostDeclarations,
//   ];
//
//   hostRule.block.children = hostMergedDeclarations;
// }
