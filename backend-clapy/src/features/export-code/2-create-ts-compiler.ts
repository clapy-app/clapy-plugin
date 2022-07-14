import { HttpException, StreamableFile } from '@nestjs/common';
import type { Readable } from 'stream';
import type { Statement } from 'typescript';
import ts from 'typescript';

import type { Nil } from '../../common/general-utils.js';
import { isNonEmptyObject } from '../../common/general-utils.js';
import { perfMeasure } from '../../common/perf-utils.js';
import { flags } from '../../env-and-config/app-config.js';
import { env } from '../../env-and-config/env.js';
import type { Dict, ExportCodePayload } from '../sb-serialize-preview/sb-serialize.model.js';
import {
  createModuleCode,
  createNodeContext,
  generateAllComponents,
  mkModuleContext,
  printFileInProject,
} from './3-gen-component.js';
import { writeSVGReactComponents } from './7-write-svgr.js';
import { diagnoseFormatTsFiles, prepareCssFiles } from './8-diagnose-format-ts-files.js';
import { makeZip, uploadToCSB, writeToDisk } from './9-upload-to-csb.js';
import type { BaseStyleOverride, CodeDict, CompAst, ModuleContext, ParentNode, ProjectContext } from './code.model.js';
import { readReactTemplateFiles } from './create-ts-compiler/0-read-template-files.js';
import { toCSBFiles } from './create-ts-compiler/9-to-csb-files.js';
import type { ComponentNode2, InstanceNode2, SceneNode2 } from './create-ts-compiler/canvas-utils.js';
import { reactCRADir, reactViteDir, separateTsAndResources } from './create-ts-compiler/load-file-utils-and-paths.js';
import { addRulesToAppCss } from './css-gen/addRulesToAppCss.js';
import { addFontsToIndexHtml } from './figma-code-map/font.js';
import { addMUIProviders, addMUIProvidersImports } from './frameworks/mui/mui-add-globals.js';
import { addMUIPackages } from './frameworks/mui/mui-add-packages.js';
import { addScssPackage, getAppCssPathAndRenameSCSS, getCSSExtension } from './frameworks/scss/scss-utils.js';
import { genStyles } from './frameworks/style-dictionary/gen-styles.js';
import type { TokenStore } from './frameworks/style-dictionary/types/types/tokens';
import { genCompUsage, prepareCompUsageWithOverrides } from './gen-node-utils/3-gen-comp-utils.js';
import { fillWithComponent, fillWithDefaults } from './gen-node-utils/default-node.js';
import { mkClassAttr2, mkDefaultImportDeclaration, mkSimpleImportDeclaration } from './gen-node-utils/ts-ast-utils.js';

const { factory } = ts;

function getCSSVariablesFileName(cssExt: string) {
  return `variables.${cssExt}`;
}

const enableMUIInDev = false;

export async function exportCode(
  { root, parent: p, components, svgs, images, styles, extraConfig, tokens }: ExportCodePayload,
  uploadToCsb = true,
) {
  if (!extraConfig.output) extraConfig.output = 'csb';
  extraConfig.useViteJS = env.isDev || extraConfig.output === 'zip';
  const parent = p as ParentNode | Nil;
  const instancesInComp: InstanceNode2[] = [];
  for (const comp of components) {
    fillWithDefaults(comp, instancesInComp, true);
  }
  const compNodes = components.reduce((prev, cur) => {
    prev[cur.id] = cur;
    return prev;
  }, {} as Dict<ComponentNode2>) as unknown as Dict<ComponentNode2>;
  fillWithDefaults(p, instancesInComp, false, true);
  for (const instance of instancesInComp) {
    fillWithComponent(instance, compNodes);
  }
  fillWithComponent(root, compNodes);
  if (!root) {
    throw new HttpException(
      'Clapy failed to read your selection and is unable to generate code. Please let us know so that we can fix it.',
      400,
    );
  }
  perfMeasure('a');

  const appCompDir = 'src';
  const appCompName = 'App';
  // Initialize the project template with base files
  const filesCsb = await readReactTemplateFiles(extraConfig.useViteJS ? reactViteDir : reactCRADir);
  const appCssPath = getAppCssPathAndRenameSCSS(filesCsb, extraConfig, appCompDir, appCompName);
  // If useful, resources['tsconfig.json']
  const [tsFiles, { [appCssPath]: appCss, ...resources }] = separateTsAndResources(filesCsb);
  const cssFiles: CodeDict = { [appCssPath]: appCss };
  perfMeasure('b');

  const { varNamesMap, cssVarsDeclaration, tokensRawMap } = genStyles(tokens as TokenStore | undefined);
  perfMeasure('b2');

  // Most context elements here should be per component (but not compNamesAlreadyUsed).
  // When we have multiple components, we should split in 2 locations to initialize the context (global vs per component)
  const projectContext: ProjectContext = {
    compNamesAlreadyUsed: new Set(),
    assetsAlreadyUsed: new Set(),
    fontWeightUsed: new Map(),
    compNodes,
    components: new Map(),
    resources,
    tsFiles,
    svgToWrite: {},
    cssFiles,
    svgs,
    svgsRead: new Map(),
    images,
    styles,
    enableMUIFramework: env.isDev ? enableMUIInDev : !!extraConfig.enableMUIFramework,
    varNamesMap,
    tokensRawMap,
    extraConfig,
    newDependencies: {},
    newDevDependencies: {},
  };

  const lightAppModuleContext = mkModuleContext(
    projectContext,
    {} as unknown as SceneNode2,
    undefined,
    appCompDir,
    appCompName,
    undefined,
    true,
    false,
    true,
  );
  perfMeasure('c');
  const lightAppNodeContext = createNodeContext(lightAppModuleContext, root, parent);
  perfMeasure('c2');
  const componentContext = prepareCompUsageWithOverrides(lightAppNodeContext, root, true);
  perfMeasure('c3');
  generateAllComponents(projectContext);
  perfMeasure('d');
  if (!(root as SceneNode2).componentContext) {
    (root as SceneNode2).componentContext = componentContext;
  }
  const compAst = genCompUsage(root);
  perfMeasure('d2');

  addCompToAppRoot(lightAppModuleContext, parent, cssVarsDeclaration, compAst);
  perfMeasure('e');

  await writeSVGReactComponents(projectContext);
  perfMeasure('f');

  const tsFilesFormatted = await diagnoseFormatTsFiles(tsFiles); // Takes time with many files
  perfMeasure('g');
  await prepareCssFiles(cssFiles);
  perfMeasure('h');

  await addFontsToIndexHtml(projectContext);
  perfMeasure('i');

  addPackages(projectContext);

  const csbFiles = toCSBFiles(tsFilesFormatted, cssFiles, resources);
  perfMeasure('j');
  if (env.isDev) {
    // Useful to list SVGs that haven't been processed among the list of exported SVGs.
    // E.g. it will list the hidden SVGs in the instances.
    if (flags.listUnreadSVGs) {
      for (const [nodeId, svg] of Object.entries(projectContext.svgs)) {
        if (!projectContext.svgsRead.has(nodeId)) {
          console.warn('SVG unread for node', svg.name);
        }
      }
    }

    // Useful for the dev in watch mode. Uncomment when needed.
    // console.log(csbFiles[`src/components/${compName}/${compName}.module.css`].content);
    // console.log(csbFiles[`src/components/${compName}/${compName}.tsx`].content);
    //
    // console.log(project.getSourceFile('/src/App.tsx')?.getFullText());
    perfMeasure('k');
    await writeToDisk(csbFiles, (root as SceneNode2).componentContext!, extraConfig.isClapyFile); // Takes time with many files
    perfMeasure('l');
  }
  if (Object.keys(csbFiles).length > 500) {
    throw new HttpException(
      'The generated code has more than 500 components, which is the max supported by CodeSandbox. Please let us know to find how we could solve it.',
      400,
    );
  }
  if (!env.isDev || uploadToCsb) {
    if (extraConfig.output === 'zip') {
      const zipResponse = await makeZip(csbFiles);
      return new StreamableFile(zipResponse as Readable);
    } else {
      const csbResponse = await uploadToCSB(csbFiles);
      return csbResponse;
    }
  }
}

function addCompToAppRoot(
  appModuleContext: ModuleContext,
  parentNode: ParentNode | Nil,
  cssVarsDeclaration: string | Nil,
  compAst: CompAst | undefined,
) {
  const {
    compDir,
    compName,
    projectContext: { cssFiles, extraConfig },
    imports,
    statements,
  } = appModuleContext;
  const { isFTD } = extraConfig;
  const cssExt = getCSSExtension(extraConfig);

  const cssFileName = `${compName}.module.${cssExt}`;
  const appCssPath = `${compDir}/${cssFileName}`;

  // Add design tokens on top of the file, if any
  if (cssVarsDeclaration && !isFTD) {
    const cssVariablesFile = getCSSVariablesFileName(cssExt);
    const cssVariablesPath = `${compDir}/${cssVariablesFile}`;
    const cssVarModuleSpecifier = `./${cssVariablesFile}`;
    imports[cssVarModuleSpecifier] = mkSimpleImportDeclaration(cssVarModuleSpecifier);
    cssFiles[cssVariablesPath] = cssVarsDeclaration;
  }

  // Add CSS classes import in TSX file
  const cssModuleModuleSpecifier = `./${cssFileName}`;
  imports[cssModuleModuleSpecifier] = mkDefaultImportDeclaration('classes', cssModuleModuleSpecifier);

  // Specific to the root node. Don't apply on other components.
  // If the node is not at the root level in Figma, we add some CSS rules from the parent in App.module.css to ensure it renders well.
  let updatedAppCss = addRulesToAppCss(appModuleContext, cssFiles[appCssPath], parentNode) || cssFiles[appCssPath];

  cssFiles[appCssPath] = updatedAppCss;

  addMUIProvidersImports(appModuleContext);

  // The component import is added inside genComponent itself (with a TODO to refactor)

  let appTsx: ts.JsxElement | ts.JsxFragment = mkAppCompTsx(compAst);
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

  createModuleCode(appModuleContext, appTsx, prefixStatements);

  printFileInProject(appModuleContext);
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

function addPackages(projectContext: ProjectContext) {
  addMUIPackages(projectContext);
  addScssPackage(projectContext);
  writePackages(projectContext);
}

function writePackages(projectContext: ProjectContext) {
  const { resources, newDependencies, newDevDependencies } = projectContext;
  if (isNonEmptyObject(newDependencies) || isNonEmptyObject(newDevDependencies)) {
    try {
      const packageJson = JSON.parse(resources['package.json']);
      Object.assign(packageJson.dependencies, newDependencies);
      Object.assign(packageJson.devDependencies, newDevDependencies);
      resources['package.json'] = JSON.stringify(packageJson, null, 2);
      // package.json typings available at
      // https://github.com/sindresorhus/type-fest
      // and/or https://www.npmjs.com/package/package-json-type
    } catch (error) {
      console.warn(
        'Cannot parse and update package.json. Skipping in production, but the generated project is incomplete.',
      );
      if (!env.isProd) {
        throw error;
      }
    }
  }
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
