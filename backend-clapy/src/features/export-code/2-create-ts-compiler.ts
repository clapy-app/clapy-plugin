import { HttpException, StreamableFile } from '@nestjs/common';
import type { Readable } from 'stream';
import ts from 'typescript';

import type { Nil } from '../../common/general-utils.js';
import { isNonEmptyObject } from '../../common/general-utils.js';
import { perfMeasure } from '../../common/perf-utils.js';
import { flags } from '../../env-and-config/app-config.js';
import { env } from '../../env-and-config/env.js';
import { warnOrThrow } from '../../utils.js';
import { sendCodeToGithub } from '../github/github-service.js';
import type { ComponentNode2, Dict, ExportCodePayload } from '../sb-serialize-preview/sb-serialize.model.js';
import { UserSettingsTarget } from '../sb-serialize-preview/sb-serialize.model.js';
import type { AccessTokenDecoded } from '../user/user.utils.js';
import { hasRoleNoCodeSandbox } from '../user/user.utils.js';
import { createNodeContext, generateAllComponents, mkModuleContext } from './3-gen-component.js';
import { formatTsFiles, prepareCssFiles, prepareHtmlFiles } from './8-format-ts-files.js';
import type { CSBResponse } from './9-upload-to-csb.js';
import { makeZip, patchViteJSConfigForDev, uploadToCSB, writeToDisk } from './9-upload-to-csb.js';
import type { ModuleContext, ParentNode, ProjectContext } from './code.model.js';
import { readTemplateFile, readTemplateFiles } from './create-ts-compiler/0-read-template-files.js';
import { toCSBFiles } from './create-ts-compiler/9-to-csb-files.js';
import type { SceneNode2 } from './create-ts-compiler/canvas-utils.js';
import { separateTsCssAndResources } from './create-ts-compiler/load-file-utils-and-paths.js';
import { addRulesToAppCss } from './css-gen/addRulesToAppCss.js';
import { getResetsCssModulePath, getResetsCssModuleSrcPath } from './css-gen/css-gen-utils.js';
import { addFontsToIndexHtml } from './figma-code-map/font.js';
import type { FrameworkConnector } from './frameworks/framework-connectors.js';
import { frameworkConnectors } from './frameworks/framework-connectors.js';
import { prepareCompUsageWithOverrides } from './gen-node-utils/3-gen-comp-utils.js';
import { mkDefaultImportDeclaration, mkSimpleImportDeclaration } from './gen-node-utils/ts-ast-utils.js';
import { addMUIPackages } from './tech-integration/mui/mui-add-packages.js';
import { addScssPackage, getCSSExtension, updateFilesAndContentForScss } from './tech-integration/scss/scss-utils.js';
import { genStyles } from './tech-integration/style-dictionary/gen-styles.js';
import type { TokenStore } from './tech-integration/style-dictionary/types/types/tokens/TokensStore.js';

const { factory } = ts;

function getCSSVariablesFileName(cssExt: string) {
  return `variables.${cssExt}`;
}

const enableMUIInDev = false;

export async function exportCode(
  { root, components, svgs, images, styles, extraConfig, tokens, page, githubAccessToken }: ExportCodePayload,
  uploadToCsb = true,
  user: AccessTokenDecoded,
  compNodes: Dict<ComponentNode2>,
) {
  if (env.localPreviewInsteadOfCsb) {
    uploadToCsb = false;
  }
  // /Legacy
  extraConfig.useZipProjectTemplate = env.localPreviewInsteadOfCsb || extraConfig.target === 'zip';
  const fwConnector = frameworkConnectors[extraConfig.framework || 'react'];
  const parent = (root as any)?.parent as ParentNode | Nil;
  if (!root) {
    throw new HttpException(
      'Clapy failed to read your selection and is unable to generate code. Please let us know so that we can fix it.',
      400,
    );
  }
  perfMeasure('a');

  const { varNamesMap, cssVarsDeclaration, tokensRawMap } = genStyles(tokens as TokenStore | undefined);
  perfMeasure('b1');

  // Initialize the project template with base files
  let filesCsb = await readTemplateFiles(fwConnector.templateBaseDirectory(extraConfig));
  let [tsFiles, cssFiles, resources] = separateTsCssAndResources(filesCsb);

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
    enableMUIFramework:
      extraConfig.framework === 'react' && (env.isDev ? enableMUIInDev : !!extraConfig.enableMUIFramework),
    varNamesMap,
    tokensRawMap,
    extraConfig,
    newDependencies: {},
    newDevDependencies: {},
    fwConnector,
    page,
  };

  cssFiles[getResetsCssModulePath(projectContext)] = await readTemplateFile(getResetsCssModuleSrcPath(projectContext));

  // /!\ filesCsb doesn't share any ref with tsFiles, cssFiles and resources. It should not be used anymore.

  updateFilesAndContentForScss(projectContext);
  fwConnector.patchProjectConfigFiles(projectContext, extraConfig);
  perfMeasure('b2');

  const { appCompDir, appBaseCompName } = fwConnector;

  const lightAppModuleContext = mkModuleContext(
    projectContext,
    {} as unknown as SceneNode2,
    undefined,
    appCompDir,
    fwConnector.getCompName(projectContext, root, appBaseCompName),
    appBaseCompName,
    undefined,
    true,
    false,
    true,
    false,
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
  const compAst = fwConnector.genCompUsage(projectContext, root);
  perfMeasure('d2');

  addCompToAppRoot(lightAppModuleContext, parent, cssVarsDeclaration, compAst);
  perfMeasure('e');

  await fwConnector.writeSVGReactComponents(projectContext);
  perfMeasure('f');

  patchViteJSConfigForDev(projectContext);

  fwConnector.cleanUpProject(projectContext);

  tsFiles = await formatTsFiles(projectContext); // Takes time with many files
  perfMeasure('g');
  await prepareCssFiles(projectContext);
  perfMeasure('h');
  await prepareHtmlFiles(projectContext);
  perfMeasure('h2');

  await addFontsToIndexHtml(projectContext);
  perfMeasure('i');

  addPackages(projectContext);

  const csbFiles = toCSBFiles(tsFiles, cssFiles, resources);
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
    // console.log(csbFiles[`${srcCompPrefix}${compName}/${compName}.module.css`].content);
    // console.log(csbFiles[`${srcCompPrefix}${compName}/${compName}.tsx`].content);
    //
    // console.log(project.getSourceFile('/src/App.tsx')?.getFullText());
    perfMeasure('k');
    await writeToDisk(csbFiles, (root as SceneNode2).componentContext!, extraConfig.isClapyFile); // Takes time with many files
    perfMeasure('l');
  }
  if (Object.keys(csbFiles).length > 500) {
    throw new HttpException(
      'The generated code has more than 500 components, which is the max supported by CodeSandbox. Please let us know and we will find a solution. You could also consider downloading the source code as a zip file.',
      400,
    );
  }
  if (!env.isDev || uploadToCsb || extraConfig.target !== UserSettingsTarget.csb) {
    const isNoCodesandboxUser = hasRoleNoCodeSandbox(user);
    if (extraConfig.target === UserSettingsTarget.zip) {
      const zipResponse = await makeZip(csbFiles);
      return new StreamableFile(zipResponse as Readable);
    } else if (extraConfig.target === UserSettingsTarget.github) {
      return sendCodeToGithub(projectContext, githubAccessToken, user, csbFiles);
    } else {
      if (isNoCodesandboxUser) {
        throw new Error("You don't have the permission to upload the generated code to CodeSandbox.");
      }
      const csbResponse = await uploadToCSB(csbFiles);
      return csbResponse;
    }
  }
  return { sandbox_id: 'false' } as CSBResponse;
}

function addCompToAppRoot(
  appModuleContext: ModuleContext,
  parentNode: ParentNode | Nil,
  cssVarsDeclaration: string | Nil,
  compAst: ReturnType<FrameworkConnector['genCompUsage']>,
) {
  const { compDir, baseCompName, projectContext, imports, statements } = appModuleContext;
  const { cssFiles, extraConfig, fwConnector } = projectContext;
  const { isFTD } = extraConfig;
  const cssExt = getCSSExtension(projectContext);

  // Add design tokens on top of the file, if any
  if (cssVarsDeclaration && !isFTD) {
    const cssVariablesFile = getCSSVariablesFileName(cssExt);
    const cssVariablesPath = `${compDir}/${cssVariablesFile}`;
    const cssVarModuleSpecifier = `./${cssVariablesFile}`;
    imports[cssVarModuleSpecifier] = mkSimpleImportDeclaration(cssVarModuleSpecifier);
    cssFiles[cssVariablesPath] = cssVarsDeclaration;
  }

  const cssFileName = `${baseCompName}.${fwConnector.cssFileNameMiddlePart}.${cssExt}`;
  const appCssPath = `${compDir}/${cssFileName}`;

  // Add CSS classes import in TSX file
  const cssModuleModuleSpecifier = `./${cssFileName}`;
  imports[cssModuleModuleSpecifier] = mkDefaultImportDeclaration('classes', cssModuleModuleSpecifier);

  // Specific to the root node. Don't apply on other components.
  // If the node is not at the root level in Figma, we add some CSS rules from the parent in App.module.css to ensure it renders well.
  if (cssFiles[appCssPath] == null) {
    warnOrThrow(
      `CSS file does not exist in template or has undefined content. Path: ${appCssPath}, framework: ${extraConfig.framework}`,
    );
  } else {
    let updatedAppCss = addRulesToAppCss(appModuleContext, cssFiles[appCssPath], parentNode) || cssFiles[appCssPath];
    cssFiles[appCssPath] = updatedAppCss;
  }

  fwConnector.writeRootCompFileCode(appModuleContext, compAst, appCssPath, parentNode);
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
