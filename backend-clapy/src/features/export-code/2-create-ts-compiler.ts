import { HttpException } from '@nestjs/common';
import ts from 'typescript';

import { Nil } from '../../common/general-utils';
import { perfMeasure } from '../../common/perf-utils';
import { env } from '../../env-and-config/env';
import { ComponentNodeNoMethod, Dict, ExportCodePayload } from '../sb-serialize-preview/sb-serialize.model';
import { createModuleCode, getOrGenComponent, printFileInProject } from './3-gen-component';
import { writeSVGReactComponents } from './7-write-svgr';
import { diagnoseFormatTsFiles, prepareCssFiles } from './8-diagnose-format-ts-files';
import { uploadToCSB, writeToDisk } from './9-upload-to-csb';
import { CodeDict, ModuleContext, ParentNode, ProjectContext } from './code.model';
import { readReactTemplateFiles } from './create-ts-compiler/0-read-template-files';
import { toCSBFiles } from './create-ts-compiler/9-to-csb-files';
import { ComponentNode2 } from './create-ts-compiler/canvas-utils';
import { separateTsAndResources } from './create-ts-compiler/load-file-utils-and-paths';
import { addRulesToAppCss } from './css-gen/addRulesToAppCss';
import { fillWithComponent, fillWithDefaults } from './figma-code-map/details/default-node';
import { mkClassAttr, mkComponentUsage, mkDefaultImportDeclaration } from './figma-code-map/details/ts-ast-utils';
import { addFontsToIndexHtml } from './figma-code-map/font';
import { addMUIProviders, addMUIProvidersImports } from './frameworks/mui/mui-add-globals';
import { addMUIPackages } from './frameworks/mui/mui-add-packages';
import { genStyles } from './frameworks/style-dictionary/gen-styles';
import { TokenStore } from './frameworks/style-dictionary/types/types/tokens';

const { factory } = ts;

const appCssPath = 'src/App.module.css';

const enableMUIInDev = false;

export async function exportCode(
  { root, parent: p, components, images, styles, extraConfig, tokens }: ExportCodePayload,
  uploadToCsb = true,
) {
  const parent = p as ParentNode | Nil;
  for (const comp of components) {
    fillWithDefaults(comp);
  }
  const compNodes = components.reduce((prev, cur) => {
    prev[cur.id] = cur;
    return prev;
  }, {} as Dict<ComponentNodeNoMethod>) as unknown as Dict<ComponentNode2>;
  fillWithDefaults(p);
  fillWithComponent(root, compNodes);
  if (!root) {
    throw new HttpException(
      'Clapy failed to read your selection and is unable to generate code. Please let us know so that we can fix it.',
      400,
    );
  }
  perfMeasure('a');
  // Initialize the project template with base files
  const filesCsb = await readReactTemplateFiles();
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
  };

  const lightAppModuleContext = {
    projectContext,
    imports: [] as unknown[],
    statements: [] as unknown[],
    pageName: undefined,
    compDir: 'src',
    compName: 'App',
    inInteractiveElement: false,
  } as ModuleContext;
  perfMeasure('c');
  const moduleContext = getOrGenComponent(lightAppModuleContext, root, parent, true);
  perfMeasure('d');

  addCompToAppRoot(lightAppModuleContext, moduleContext, parent, cssVarsDeclaration);
  perfMeasure('e');

  await writeSVGReactComponents(projectContext);
  perfMeasure('f');

  const tsFilesFormatted = await diagnoseFormatTsFiles(tsFiles); // Takes time with many files
  perfMeasure('g');
  await prepareCssFiles(cssFiles);
  perfMeasure('h');

  addFontsToIndexHtml(projectContext);
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
    const csbResponse = await uploadToCSB(csbFiles);
    return csbResponse;
  }
}

function addCompToAppRoot(
  appModuleContext: ModuleContext,
  childModuleContext: ModuleContext,
  parentNode: ParentNode | Nil,
  cssVarsDeclaration: string | Nil,
) {
  const {
    compName,
    projectContext: { cssFiles },
    imports,
    statements,
  } = appModuleContext;

  // Add CSS classes import in TSX file
  imports.push(mkDefaultImportDeclaration('classes', `./${compName}.module.css`));

  // Specific to the root node. Don't apply on other components.
  // If the node is not at the root level in Figma, we add some CSS rules from the parent in App.module.css to ensure it renders well.
  let updatedAppCss = addRulesToAppCss(cssFiles[appCssPath], parentNode) || cssFiles[appCssPath];

  // Add design tokens on top of the file, if any
  if (cssVarsDeclaration) {
    updatedAppCss = `${cssVarsDeclaration}\n\n${updatedAppCss}`;
  }

  cssFiles[appCssPath] = updatedAppCss;

  addMUIProvidersImports(appModuleContext);

  // The component import is added inside genComponent itself (with a TODO to refactor)

  let appTsx: ts.JsxElement | ts.JsxFragment = mkAppCompTsx(childModuleContext.compName);
  appTsx = addMUIProviders(appModuleContext, appTsx);

  createModuleCode(appModuleContext, appTsx, []);

  printFileInProject(appModuleContext);
}

function mkAppCompTsx(childComponentName: string) {
  return factory.createJsxElement(
    factory.createJsxOpeningElement(
      factory.createIdentifier('div'),
      undefined,
      factory.createJsxAttributes([mkClassAttr('root', true)]),
    ),
    [mkComponentUsage(childComponentName)],
    factory.createJsxClosingElement(factory.createIdentifier('div')),
  );
}

function addPackages(projectContext: ProjectContext) {
  addMUIPackages(projectContext);
}
