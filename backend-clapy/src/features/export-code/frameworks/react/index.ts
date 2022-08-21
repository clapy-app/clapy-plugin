import type { ChildNode } from 'parse5/dist/tree-adapters/default.js';
import type { JsxChild, Statement } from 'typescript';
import ts from 'typescript';

import { writeSVGReactComponents } from '../../7-write-svgr.js';
import { countOccurences, isNonEmptyObject } from '../../../../common/general-utils.js';
import { exportTemplatesDir } from '../../../../root.js';
import type { Dict, ExtraConfig } from '../../../sb-serialize-preview/sb-serialize.model.js';
import type {
  BaseStyleOverride,
  CompAst,
  CompContext,
  JsxOneOrMore,
  ModuleContext,
  NodeContext,
  ProjectContext,
  StyleOverride,
  SwapAst,
} from '../../code.model.js';
import type { FlexNode, InstanceNode2, SceneNode2 } from '../../create-ts-compiler/canvas-utils.js';
import { isInstance } from '../../create-ts-compiler/canvas-utils.js';
import { resetsModuleBase } from '../../create-ts-compiler/load-file-utils-and-paths.js';
import { cssAstToString, mkClassSelectorCss } from '../../css-gen/css-factories-low.js';
import { getComponentName } from '../../gen-node-utils/gen-unique-name-utils.js';
import { registerSvgForWrite } from '../../gen-node-utils/process-nodes-utils.js';
import {
  createClassAttrForClassNoOverride,
  createClassAttrForNode,
  getOrCreateCompContext,
  mkClassAttr2,
  mkClassAttr3,
  mkClassesAttribute2,
  mkCompFunction,
  mkDefaultImportDeclaration,
  mkHidingsAttribute,
  mkHrefAttr,
  mkNamedImportsDeclaration,
  mkNoReferrerAttr,
  mkPropInterface,
  mkSwapInstanceAlone,
  mkSwapInstanceAndHideWrapper,
  mkSwapsAttribute,
  mkTag,
  mkTargetBlankAttr,
  mkTextOverridesAttribute,
  mkWrapHideAndTextOverrideAst,
} from '../../gen-node-utils/ts-ast-utils.js';
import { printTsStatements } from '../../gen-node-utils/ts-print.js';
import { addMUIProviders, addMUIProvidersImports } from '../../tech-integration/mui/mui-add-globals.js';
import { getCSSExtension, scssDevDependencies } from '../../tech-integration/scss/scss-utils.js';
import type { FrameworkConnector, FwAttr, FwNodeOneOrMore } from '../framework-connectors.js';

const { factory } = ts;

const csbDir = `${exportTemplatesDir}/react-cra`;
const zipDir = `${exportTemplatesDir}/react-vite`;

export const reactConnector: FrameworkConnector = {
  templateBaseDirectory: extraConfig => (extraConfig.useZipProjectTemplate ? zipDir : csbDir),
  getIndexHtmlPath: ({ useZipProjectTemplate }) => (useZipProjectTemplate ? 'index.html' : 'public/index.html'),
  enableInstanceOverrides: true,
  patchProjectConfigFiles: () => {},
  appCompDir: 'src',
  appBaseCompName: 'App',
  // MyRectangle
  getBaseCompName: (projectContext, node) => getComponentName(projectContext, node),
  // MyRectangle
  getCompName: (projectContext, node, baseCompName) => baseCompName,
  // MyRectangle
  getCompDirName: (baseCompName: string) => baseCompName,
  // MyRectangle.tsx
  getCompFileName: compDir => `${compDir}.tsx`,
  cssFileNameMiddlePart: 'module',
  assetsResourceDir: 'public/assets/',
  assetsCssBaseUrl: 'assets/',
  webpackIgnoreInCSS: true,
  addScssPackages: (newDevDependencies: Dict<string>) => {
    Object.assign(newDevDependencies, scssDevDependencies);
  },
  patchCssResets: () => {},
  registerSvgForWrite,
  createClassAttribute: createClassAttrForNode,
  createClassAttributeSimple: mkClassAttr3,
  createClassAttrForClassNoOverride,
  mkSelector: (context, className) => mkClassSelectorCss(className),
  createNodeTag: (context, attributes, children, node) => {
    const ast2 = mkTag(context.tagName, attributes as ts.JsxAttribute[], children as ts.JsxChild[]);
    return wrapHideAndTextOverride(context, ast2, node, false);
  },
  mkSwapInstanceAlone: (context, ast, node) => mkSwapInstanceAlone(context, ast as ts.JsxSelfClosingElement, node),
  wrapHideAndTextOverride,
  createText: text => factory.createJsxText(text, false),
  createLinkAttributes: href => [mkHrefAttr(href), mkTargetBlankAttr(), mkNoReferrerAttr()],
  wrapNode: (node, tagName, attributes) =>
    mkTag(tagName, attributes as ts.JsxAttribute[], (Array.isArray(node) ? node : [node]) as ts.JsxChild[]),
  writeFileCode: (ast, moduleContext) => {
    const { projectContext, compDir, compName, imports } = moduleContext;
    const { cssFiles, extraConfig } = projectContext;

    const [tsx, css] = ast;

    createModuleCode(
      moduleContext,
      tsx as Exclude<
        typeof tsx,
        ChildNode | ChildNode[] | (JsxChild | ChildNode)[] | ts.BinaryExpression | ts.ConditionalExpression
      >,
    );

    const cssExt = getCSSExtension(extraConfig);
    if (isNonEmptyObject(css.children)) {
      const cssFileName = `${compName}.module.${cssExt}`;
      cssFiles[`${compDir}/${cssFileName}`] = cssAstToString(css);
      const cssModuleModuleSpecifier = `./${cssFileName}`;
      imports[cssModuleModuleSpecifier] = mkDefaultImportDeclaration('classes', cssModuleModuleSpecifier);
    }

    addCssResetsModuleImport(moduleContext);

    printFileInProject(moduleContext);
  },
  genCompUsage,
  createSvgTag: (svgPathVarName, svgAttributes) =>
    mkComponentUsage(svgPathVarName, svgAttributes as ts.JsxAttribute[] | undefined),
  addExtraSvgAttributes: () => {},
  writeRootCompFileCode(appModuleContext, compAst, appCssPath, parent) {
    const { statements, projectContext } = appModuleContext;
    const { extraConfig } = projectContext;

    addMUIProvidersImports(appModuleContext);

    // The component import is added inside genComponent itself (with a TODO to refactor)

    let appTsx: ts.JsxElement | ts.JsxFragment = mkAppCompTsx(compAst as CompAst | undefined, extraConfig);
    appTsx = addMUIProviders(appModuleContext, appTsx);

    let prefixStatements: Statement[] | undefined = undefined;
    if (extraConfig.isFTD) {
      // Add demo patch
      const themeDefaultValue = 'Brand-A-Lightmode';
      const themeValues = {
        'Brand-A-Lightmode': 'Brand A light mode',
        'Brand-A-Darkmode': 'Brand A dark mode',
        'Brand-B-Lightmode': 'Brand B light mode',
        'Brand-B-Darkmode': 'Brand B dark mode',
        'Brand-C-Lightmode': 'Brand C light mode',
        'Brand-C-Darkmode': 'Brand C dark mode',
        'Brand-I-Lightmode': 'Brand I light mode',
        'Brand-I-Darkmode': 'Brand I dark mode',
      };
      appTsx = addDemoThemeSwitcher(appModuleContext, appTsx, themeValues, themeDefaultValue);
      statements.push(mkInitBodyClassName(themeDefaultValue));
      prefixStatements = [mkSwitchThemeHandler()];
    }

    createModuleCode(appModuleContext, appTsx, prefixStatements, true);

    addCssResetsModuleImport(appModuleContext);

    printFileInProject(appModuleContext);

    // If the parent node is vertical, add a flex-direction: column to the root.
    if ((parent as FlexNode | undefined)?.layoutMode === 'VERTICAL') {
      const { cssFiles } = projectContext;
      cssFiles[appCssPath] = cssFiles[appCssPath].replace(/(\.root\s*\{[^\}]*)\}/, '$1;flex-direction:column}');
    }
  },
  writeSVGReactComponents,
};

function wrapHideAndTextOverride<T extends boolean>(
  context: NodeContext,
  ast: FwNodeOneOrMore | undefined,
  node: SceneNode2,
  isJsExprAllowed: T,
) {
  return mkWrapHideAndTextOverrideAst(context, ast as JsxOneOrMore, node, isJsExprAllowed);
}

function createModuleCode(
  moduleContext: ModuleContext,
  tsx: JsxOneOrMore | undefined,
  prefixStatements: Statement[] = [],
  skipAnnotation?: boolean,
) {
  const { imports, statements, compName } = moduleContext;

  // Add React imports: import { memo } from 'react';
  imports['react'] = mkNamedImportsDeclaration(
    ['memo', ...(moduleContext.projectContext.extraConfig.isFTD && compName === 'App' ? ['useCallback'] : [])],
    'react',
  );
  // import type { FC, ReactNode } from 'react';
  imports['react#types'] = mkNamedImportsDeclaration(
    ['FC', ...(moduleContext.swaps.size > 0 || moduleContext.textOverrideProps.size > 0 ? ['ReactNode'] : [])],
    'react',
    true,
  );

  // Add component Prop interface
  statements.push(mkPropInterface(moduleContext));

  // Add the component
  statements.push(mkCompFunction(moduleContext, compName, tsx, prefixStatements, skipAnnotation));
}

function printFileInProject(moduleContext: ModuleContext) {
  const { projectContext, compDir, compName } = moduleContext;

  const path = `${compDir}/${compName}.tsx`;
  projectContext.tsFiles[path] = printTsStatements([
    ...Object.values(moduleContext.imports),
    ...moduleContext.statements,
  ]);
}

export function genCompUsage(projectContext: ProjectContext, node: SceneNode2, extraAttributes?: FwAttr[]) {
  if (isInstance(node)) {
    return genInstanceAst(node);
  } else {
    return genInstanceLikeAst(node, extraAttributes as ts.JsxAttribute[]);
  }
}

function genInstanceAst(node: InstanceNode2) {
  const { nodeContext: context, componentContext } = node;
  if (!componentContext) {
    throw new Error(
      `node ${node.name} should be an instance with componentContext attribute. But componentContext is undefined.`,
    );
  }
  if (!context) {
    throw new Error(`nodeContext is undefined in node ${node.name}.`);
  }
  const compContext = getOrCreateCompContext(node);
  let compAst = createComponentUsageWithAttributes(compContext, componentContext);

  // Surround instance usage with a syntax to swap with render props
  const compAst2: SwapAst | JsxOneOrMore | undefined = mkSwapInstanceAndHideWrapper(context, compAst, node);
  return compAst2;
}

function genInstanceLikeAst(node: SceneNode2, extraAttributes: ts.JsxAttribute[] | undefined) {
  const { componentContext } = node;
  if (!componentContext) {
    throw new Error(`[genInstanceLikeAst] node ${node.name} has no componentContext.`);
  }
  return mkComponentUsage(componentContext.compName, extraAttributes);
}

export function createComponentUsageWithAttributes(compContext: CompContext, componentModuleContext: ModuleContext) {
  const { instanceSwaps, instanceHidings, instanceStyleOverrides, instanceTextOverrides } = compContext;
  const {
    projectContext: { extraConfig },
  } = componentModuleContext;

  const attrs = [];

  const classOverridesArr = Object.values(instanceStyleOverrides);
  let rootClassOverride: StyleOverride | undefined;
  let otherClassOverrides: StyleOverride[] = [];
  for (const ov of classOverridesArr) {
    if (ov.propName === 'root') {
      rootClassOverride = ov;
    } else {
      otherClassOverrides.push(ov);
    }
  }
  // if (!rootClassOverride) {
  //   warnNode(node, 'No root class found in instanceClasses.');
  // }

  const classAttr = mkClassAttr2(rootClassOverride, extraConfig);
  if (classAttr) attrs.push(classAttr);

  const classesAttr = mkClassesAttribute2(componentModuleContext, otherClassOverrides);
  if (classesAttr) attrs.push(classesAttr);

  const swapAttr = mkSwapsAttribute(instanceSwaps);
  if (swapAttr) attrs.push(swapAttr);

  const hideAttr = mkHidingsAttribute(instanceHidings);
  if (hideAttr) attrs.push(hideAttr);

  const textOverrideAttr = mkTextOverridesAttribute(instanceTextOverrides);
  if (textOverrideAttr) attrs.push(textOverrideAttr);

  return mkComponentUsage(componentModuleContext.compName, attrs);
}

function mkComponentUsage(compName: string, extraAttributes?: ts.JsxAttribute[]) {
  return factory.createJsxSelfClosingElement(
    factory.createIdentifier(compName),
    undefined,
    factory.createJsxAttributes(extraAttributes || []),
  );
}

function mkAppCompTsx(compAst: CompAst | undefined, extraConfig: ExtraConfig) {
  const overrideNode: BaseStyleOverride = {
    overrideValue: 'root',
  };
  return factory.createJsxElement(
    factory.createJsxOpeningElement(
      factory.createIdentifier('div'),
      undefined,
      factory.createJsxAttributes([mkClassAttr2(overrideNode, extraConfig)]),
    ),
    compAst ? [compAst] : [],
    factory.createJsxClosingElement(factory.createIdentifier('div')),
  );
}

function addDemoThemeSwitcher(
  context: ModuleContext,
  appTsx: ts.JsxElement | ts.JsxFragment,
  themeValues: Dict<string>,
  themeDefaultValue: string,
) {
  if (!context.projectContext.extraConfig.isFTD) return appTsx;

  return factory.createJsxFragment(
    factory.createJsxOpeningFragment(),
    [
      factory.createJsxElement(
        factory.createJsxOpeningElement(
          factory.createIdentifier('select'),
          undefined,
          factory.createJsxAttributes([
            factory.createJsxAttribute(
              factory.createIdentifier('className'),
              factory.createJsxExpression(
                undefined,
                factory.createPropertyAccessExpression(
                  factory.createIdentifier('classes'),
                  factory.createIdentifier('themeSwitcher'),
                ),
              ),
            ),
            factory.createJsxAttribute(
              factory.createIdentifier('onChange'),
              factory.createJsxExpression(undefined, factory.createIdentifier('switchTheme')),
            ),
            factory.createJsxAttribute(
              factory.createIdentifier('defaultValue'),
              factory.createStringLiteral(themeDefaultValue),
            ),
          ]),
        ),
        Object.entries(themeValues).map(([key, label]) =>
          factory.createJsxElement(
            factory.createJsxOpeningElement(
              factory.createIdentifier('option'),
              undefined,
              factory.createJsxAttributes([
                factory.createJsxAttribute(factory.createIdentifier('value'), factory.createStringLiteral(key)),
              ]),
            ),
            [factory.createJsxText(label, false)],
            factory.createJsxClosingElement(factory.createIdentifier('option')),
          ),
        ),
        factory.createJsxClosingElement(factory.createIdentifier('select')),
      ),
      appTsx,
    ],
    factory.createJsxJsxClosingFragment(),
  );
}

function mkInitBodyClassName(themeDefaultValue: string) {
  return factory.createExpressionStatement(
    factory.createBinaryExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('document'), factory.createIdentifier('body')),
        factory.createIdentifier('className'),
      ),
      factory.createToken(ts.SyntaxKind.EqualsToken),
      factory.createStringLiteral(themeDefaultValue),
    ),
  );
}

function mkSwitchThemeHandler() {
  return factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier('switchTheme'),
          undefined,
          undefined,
          factory.createCallExpression(factory.createIdentifier('useCallback'), undefined, [
            factory.createArrowFunction(
              undefined,
              undefined,
              [
                factory.createParameterDeclaration(
                  undefined,
                  undefined,
                  undefined,
                  factory.createIdentifier('e'),
                  undefined,
                  undefined,
                  undefined,
                ),
              ],
              undefined,
              factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              factory.createBlock(
                [
                  factory.createExpressionStatement(
                    factory.createBinaryExpression(
                      factory.createPropertyAccessExpression(
                        factory.createPropertyAccessExpression(
                          factory.createIdentifier('document'),
                          factory.createIdentifier('body'),
                        ),
                        factory.createIdentifier('className'),
                      ),
                      factory.createToken(ts.SyntaxKind.EqualsToken),
                      factory.createPropertyAccessExpression(
                        factory.createPropertyAccessExpression(
                          factory.createIdentifier('e'),
                          factory.createIdentifier('target'),
                        ),
                        factory.createIdentifier('value'),
                      ),
                    ),
                  ),
                ],
                true,
              ),
            ),
            factory.createArrayLiteralExpression([], false),
          ]),
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );
}

function addCssResetsModuleImport(moduleContext: ModuleContext) {
  const { projectContext, compDir, imports } = moduleContext;
  const { extraConfig } = projectContext;
  const cssExt = getCSSExtension(extraConfig);
  const cssResetsFileName = `${resetsModuleBase}.${cssExt}`;
  // Count the number of times we should add '../' in the module specifier based on the component depth (number of '/' in its path).
  const nbOfCdToParent = countOccurences(compDir, '/'); /* - 1 */
  // Generate the '../../'...
  const moduleSpecPrefix = new Array(nbOfCdToParent).fill('../').join('');
  const cssResetsModuleSpecifier = `${moduleSpecPrefix || './'}${cssResetsFileName}`;
  imports[cssResetsModuleSpecifier] = mkDefaultImportDeclaration('resets', cssResetsModuleSpecifier);
}
