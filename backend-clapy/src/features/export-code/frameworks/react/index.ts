import type { ChildNode } from 'parse5/dist/tree-adapters/default.js';
import type { JsxChild, Statement } from 'typescript';
import ts from 'typescript';

import { isNonEmptyObject } from '../../../../common/general-utils.js';
import { exportTemplatesDir } from '../../../../root.js';
import type { Dict } from '../../../sb-serialize-preview/sb-serialize.model.js';
import type {
  BaseStyleOverride,
  CompAst,
  JsxOneOrMore,
  ModuleContext,
  NodeContext,
  ProjectContext,
  SwapAst,
} from '../../code.model.js';
import type { InstanceNode2, SceneNode2 } from '../../create-ts-compiler/canvas-utils.js';
import { isInstance } from '../../create-ts-compiler/canvas-utils.js';
import { cssAstToString, mkClassSelectorCss } from '../../css-gen/css-factories-low.js';
import { getComponentName } from '../../gen-node-utils/gen-unique-name-utils.js';
import {
  createClassAttrForClassNoOverride,
  createClassAttrForNode,
  createComponentUsageWithAttributes,
  getOrCreateCompContext,
  mkClassAttr2,
  mkCompFunction,
  mkComponentUsage,
  mkDefaultImportDeclaration,
  mkHrefAttr,
  mkNamedImportsDeclaration,
  mkNoReferrerAttr,
  mkPropInterface,
  mkSwapInstanceAndHideWrapper,
  mkTag,
  mkTargetBlankAttr,
  mkWrapHideAndTextOverrideAst,
} from '../../gen-node-utils/ts-ast-utils.js';
import { printTsStatements } from '../../gen-node-utils/ts-print.js';
import { addMUIProviders, addMUIProvidersImports } from '../../tech-integration/mui/mui-add-globals.js';
import { getCSSExtension } from '../../tech-integration/scss/scss-utils.js';
import type { FrameworkConnector, FwNodeOneOrMore } from '../framework-connectors.js';
import { patchSCSSInFileContents } from './scss.js';

const { factory } = ts;

const csbDir = `${exportTemplatesDir}/react-cra`;
const zipDir = `${exportTemplatesDir}/react-vite`;

export const reactConnector: FrameworkConnector = {
  templateBaseDirectory: extraConfig => (extraConfig.useZipProjectTemplate ? zipDir : csbDir),
  getIndexHtmlPath: ({ useZipProjectTemplate: useViteJS }) => (useViteJS ? 'index.html' : 'public/index.html'),
  enableInstanceOverrides: true,
  patchSCSSInFileContents,
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
  createClassAttribute: createClassAttrForNode,
  createClassAttrForClassNoOverride,
  mkSelector: (context, className) => mkClassSelectorCss(className),
  createNodeTag: (context, attributes, children, node) => {
    const ast2 = mkTag(context.tagName, attributes as ts.JsxAttribute[], children as ts.JsxChild[]);
    return wrapHideAndTextOverride(context, ast2, node);
  },
  wrapHideAndTextOverride,
  createText: text => factory.createJsxText(text, false),
  createLinkAttributes: href => [mkHrefAttr(href), mkTargetBlankAttr(), mkNoReferrerAttr()],
  wrapNode: (node, tagName, attributes) =>
    mkTag(tagName, attributes as ts.JsxAttribute[], (Array.isArray(node) ? node : [node]) as ts.JsxChild[]),
  writeFileCode: (ast, moduleContext) => {
    const { projectContext, compDir, compName, imports } = moduleContext;
    const { cssFiles } = projectContext;

    const [tsx, css] = ast;

    createModuleCode(moduleContext, tsx as Exclude<typeof tsx, ChildNode | ChildNode[] | (JsxChild | ChildNode)[]>);

    if (isNonEmptyObject(css.children)) {
      const cssExt = getCSSExtension(projectContext.extraConfig);
      const cssFileName = `${compName}.module.${cssExt}`;
      cssFiles[`${compDir}/${cssFileName}`] = cssAstToString(css);
      const cssModuleModuleSpecifier = `./${cssFileName}`;
      imports[cssModuleModuleSpecifier] = mkDefaultImportDeclaration('classes', cssModuleModuleSpecifier);
    }

    printFileInProject(moduleContext);
  },
  genCompUsage,
  writeRootCompFileCode(appModuleContext, compAst) {
    const { statements } = appModuleContext;

    addMUIProvidersImports(appModuleContext);

    // The component import is added inside genComponent itself (with a TODO to refactor)

    let appTsx: ts.JsxElement | ts.JsxFragment = mkAppCompTsx(compAst as CompAst | undefined);
    appTsx = addMUIProviders(appModuleContext, appTsx);

    let prefixStatements: Statement[] | undefined = undefined;
    if (appModuleContext.projectContext.extraConfig.isFTD) {
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

    printFileInProject(appModuleContext);
  },
};

function wrapHideAndTextOverride(context: NodeContext, ast: FwNodeOneOrMore | undefined, node: SceneNode2) {
  return mkWrapHideAndTextOverrideAst(context, ast as JsxOneOrMore, node);
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

export function genCompUsage(projectContext: ProjectContext, node: SceneNode2) {
  if (isInstance(node)) {
    return genInstanceAst(node);
  } else {
    return genInstanceLikeAst(node);
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

function genInstanceLikeAst(node: SceneNode2) {
  const { componentContext } = node;
  if (!componentContext) {
    throw new Error(`[genInstanceLikeAst] node ${node.name} has no componentContext.`);
  }
  return mkComponentUsage(componentContext.compName);
}

function mkAppCompTsx(compAst: CompAst | undefined) {
  const overrideNode: BaseStyleOverride = {
    overrideValue: 'root',
  };
  return factory.createJsxElement(
    factory.createJsxOpeningElement(
      factory.createIdentifier('div'),
      undefined,
      factory.createJsxAttributes([mkClassAttr2(overrideNode)]),
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
