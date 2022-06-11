import { HttpException, StreamableFile } from '@nestjs/common';
import { Readable } from 'stream';
import ts, { Statement } from 'typescript';

import { Nil } from '../../common/general-utils';
import { perfMeasure } from '../../common/perf-utils';
import { env } from '../../env-and-config/env';
import { ComponentNodeNoMethod, Dict, ExportCodePayload } from '../sb-serialize-preview/sb-serialize.model';
import {
  createModuleCode,
  generateAllComponents,
  getOrGenComponent,
  mkModuleContext,
  printFileInProject,
} from './3-gen-component';
import { writeSVGReactComponents } from './7-write-svgr';
import { diagnoseFormatTsFiles, prepareCssFiles } from './8-diagnose-format-ts-files';
import { makeZip, uploadToCSB, writeToDisk } from './9-upload-to-csb';
import { BaseStyleOverride, CodeDict, ModuleContext, ParentNode, ProjectContext } from './code.model';
import { readReactTemplateFiles } from './create-ts-compiler/0-read-template-files';
import { toCSBFiles } from './create-ts-compiler/9-to-csb-files';
import { ComponentNode2, InstanceNode2, SceneNode2 } from './create-ts-compiler/canvas-utils';
import { reactCRADir, reactViteDir, separateTsAndResources } from './create-ts-compiler/load-file-utils-and-paths';
import { addRulesToAppCss } from './css-gen/addRulesToAppCss';
import { fillWithComponent, fillWithDefaults } from './figma-code-map/details/default-node';
import {
  mkClassAttr2,
  mkComponentUsage,
  mkDefaultImportDeclaration,
  mkSimpleImportDeclaration,
} from './figma-code-map/details/ts-ast-utils';
import { addFontsToIndexHtml } from './figma-code-map/font';
import { addMUIProviders, addMUIProvidersImports } from './frameworks/mui/mui-add-globals';
import { addMUIPackages } from './frameworks/mui/mui-add-packages';
import { genStyles } from './frameworks/style-dictionary/gen-styles';
import { TokenStore } from './frameworks/style-dictionary/types/types/tokens';

const { factory } = ts;

const cssVariablesFile = 'variables.css';

const enableMUIInDev = false;

export async function exportCode(
  { root, parent: p, components, images, styles, extraConfig, tokens }: ExportCodePayload,
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
  }, {} as Dict<ComponentNodeNoMethod>) as unknown as Dict<ComponentNode2>;
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
  const appCssPath = `${appCompDir}/${appCompName}.module.css`;
  // Initialize the project template with base files
  const filesCsb = await readReactTemplateFiles(extraConfig.useViteJS ? reactViteDir : reactCRADir);
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
    images,
    styles,
    enableMUIFramework: env.isDev ? enableMUIInDev : !!extraConfig.enableMUIFramework,
    varNamesMap,
    tokensRawMap,
    extraConfig,
  };

  const lightAppModuleContext = mkModuleContext(
    projectContext,
    undefined as unknown as SceneNode2,
    parent,
    undefined,
    appCompDir,
    appCompName,
    undefined,
    false,
    false,
  );
  perfMeasure('c');
  const moduleContext = getOrGenComponent(lightAppModuleContext, root, parent, true);
  perfMeasure('c2');
  generateAllComponents(projectContext);
  perfMeasure('d');

  addCompToAppRoot(lightAppModuleContext, moduleContext, parent, cssVarsDeclaration);
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
    // Useful for the dev in watch mode. Uncomment when needed.
    // console.log(csbFiles[`src/components/${compName}/${compName}.module.css`].content);
    // console.log(csbFiles[`src/components/${compName}/${compName}.tsx`].content);
    //
    // console.log(project.getSourceFile('/src/App.tsx')?.getFullText());
    perfMeasure('k');
    await writeToDisk(csbFiles, moduleContext, extraConfig.isClapyFile); // Takes time with many files
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
  childModuleContext: ModuleContext,
  parentNode: ParentNode | Nil,
  cssVarsDeclaration: string | Nil,
) {
  const {
    compDir,
    compName,
    projectContext: {
      cssFiles,
      extraConfig: { isFTD },
    },
    imports,
    statements,
  } = appModuleContext;
  const appCssPath = `${compDir}/${compName}.module.css`;

  // Add design tokens on top of the file, if any
  if (cssVarsDeclaration && !isFTD) {
    const cssVariablesPath = `${compDir}/${cssVariablesFile}`;
    const cssVarModuleSpecifier = `./${cssVariablesFile}`;
    imports[cssVarModuleSpecifier] = mkSimpleImportDeclaration(cssVarModuleSpecifier);
    cssFiles[cssVariablesPath] = cssVarsDeclaration;
  }

  // Add CSS classes import in TSX file
  const cssModuleModuleSpecifier = `./${compName}.module.css`;
  imports[cssModuleModuleSpecifier] = mkDefaultImportDeclaration('classes', cssModuleModuleSpecifier);

  // Specific to the root node. Don't apply on other components.
  // If the node is not at the root level in Figma, we add some CSS rules from the parent in App.module.css to ensure it renders well.
  let updatedAppCss = addRulesToAppCss(appModuleContext, cssFiles[appCssPath], parentNode) || cssFiles[appCssPath];

  cssFiles[appCssPath] = updatedAppCss;

  addMUIProvidersImports(appModuleContext);

  // The component import is added inside genComponent itself (with a TODO to refactor)

  let appTsx: ts.JsxElement | ts.JsxFragment = mkAppCompTsx(childModuleContext.compName);
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

function mkAppCompTsx(childComponentName: string) {
  const overrideNode: BaseStyleOverride = {
    overrideValue: 'root',
  };
  return factory.createJsxElement(
    factory.createJsxOpeningElement(
      factory.createIdentifier('div'),
      undefined,
      factory.createJsxAttributes([mkClassAttr2(overrideNode)]),
    ),
    [mkComponentUsage(childComponentName)],
    factory.createJsxClosingElement(factory.createIdentifier('div')),
  );
}

function addPackages(projectContext: ProjectContext) {
  addMUIPackages(projectContext);
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
