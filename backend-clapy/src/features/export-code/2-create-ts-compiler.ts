import { Project, SourceFile, ts } from 'ts-morph';

import { perfMeasure } from '../../common/perf-utils';
import { env } from '../../env-and-config/env';
import { ExportCodePayload } from '../sb-serialize-preview/sb-serialize.model';
import { genComponent } from './3-gen-component';
import { diagnoseFormatTsFiles, prepareCssFiles } from './8-diagnose-format-ts-files';
import { uploadToCSB, writeToDisk } from './9-upload-to-csb';
import { CodeDict, ComponentContext, ParentNode, ProjectContext } from './code.model';
import { readReactTemplateFiles } from './create-ts-compiler/0-read-template-files';
import { createProjectFromTsConfig, separateTsAndResources } from './create-ts-compiler/1-create-compiler-project';
import { addFilesToProject } from './create-ts-compiler/2-add-files-to-project';
import { toCSBFiles } from './create-ts-compiler/9-to-csb-files';
import { getFirstExportedComponentsInFileOrThrow } from './create-ts-compiler/parsing.utils';
import { addRulesToAppCss } from './css-gen/addRulesToAppCss';
import { mkComponentUsage } from './figma-code-map/details/ts-ast-utils';

const appCssPath = 'src/App.module.css';
const indexHtmlPath = 'public/index.html';

export async function exportCode({ images, root, parent, extraConfig }: ExportCodePayload, uploadToCsb = true) {
  try {
    perfMeasure('a');
    // Initialize the project template with base files
    const filesCsb = await readReactTemplateFiles();
    const { 'tsconfig.json': tsConfig, ...rest } = filesCsb;
    const project = await createProjectFromTsConfig(tsConfig);
    const [files, { [appCssPath]: appCss, ...resources }] = separateTsAndResources(rest);
    const cssFiles: CodeDict = { [appCssPath]: appCss };
    resources['tsconfig.json'] = tsConfig;
    addFilesToProject(project, files);
    perfMeasure('b');

    // Most context elements here should be per component (but not compNamesAlreadyUsed).
    // When we have multiple components, we should split in 2 locations to initialize the context (global vs per component)
    const projectContext: ProjectContext = {
      compNamesAlreadyUsed: new Set(),
      assetsAlreadyUsed: new Set(),
      fontWeightUsed: new Map(),
      project,
      resources,
      cssFiles,
      images,
    };

    const appFile = project.getSourceFileOrThrow('src/App.tsx');
    const fakeParentComponentContext = {
      projectContext,
      file: appFile,
      pageName: undefined,
      compName: 'App',
      inInteractiveElement: false,
    } as ComponentContext;
    perfMeasure('c');
    const componentContext = await genComponent(fakeParentComponentContext, root, parent);
    perfMeasure('d');

    addCompToAppRoot(project, componentContext, parent, appFile);
    perfMeasure('e');

    const tsFiles = await diagnoseFormatTsFiles(project); // Takes time with many files
    perfMeasure('f');
    await prepareCssFiles(cssFiles);
    perfMeasure('g');
    // prepareResources(resources);

    addFontsToIndexHtml(projectContext);
    perfMeasure('h');

    const csbFiles = toCSBFiles(tsFiles, cssFiles, resources);
    perfMeasure('i');
    if (env.isDev) {
      // Useful for the dev in watch mode. Uncomment when needed.
      // console.log(csbFiles[`src/components/${compName}/${compName}.module.css`].content);
      // console.log(csbFiles[`src/components/${compName}/${compName}.tsx`].content);
      //
      // console.log(project.getSourceFile('/src/App.tsx')?.getFullText());
      perfMeasure('j');
      await writeToDisk(csbFiles, extraConfig.isClapyFile); // Takes time with many files
      perfMeasure('k');
    }
    if (!env.isDev || uploadToCsb) {
      const csbResponse = await uploadToCSB(csbFiles);
      return csbResponse;
    }
  } catch (error: any) {
    console.error(error.stack);
  }
}

function addCompToAppRoot(
  project: Project,
  componentContext: ComponentContext,
  parentNode: ParentNode,
  appFile: SourceFile,
) {
  const {
    compName,
    projectContext: { cssFiles },
  } = componentContext;

  // Specific to the root node. Don't apply on other components.
  // If the node is not at the root level in Figma, we add some CSS rules from the parent in App.module.css to ensure it renders well.
  const updatedAppCss = addRulesToAppCss(cssFiles[appCssPath], parentNode);
  if (updatedAppCss) {
    cssFiles[appCssPath] = updatedAppCss;
  }

  // Insert the root component into App.tsx
  const { jsx } = getFirstExportedComponentsInFileOrThrow(appFile);
  jsx.transform(traversal => {
    const node = traversal.currentNode;
    if (!isJsxElement(node)) {
      throw new Error(`jsx first tag is not a JsxElement in App.tsx, bug.`);
    }
    const { openingElement, closingElement } = node;
    const { factory } = ts;
    return factory.createJsxElement(openingElement, [mkComponentUsage(compName)], closingElement);
  });
}

function isJsxElement(node: ts.Node): node is ts.JsxElement {
  return node.kind === ts.SyntaxKind.JsxElement;
}

function addFontsToIndexHtml(projectContext: ProjectContext) {
  const { fontWeightUsed, resources } = projectContext;
  if (fontWeightUsed.size) {
    const familyUrlFragment = Array.from(fontWeightUsed.entries())
      .map(([familyName, weightSet]) => {
        let weightFragment;
        const weightValues = Array.from(weightSet);
        if (!weightSet.size || (weightSet.size === 1 && weightValues[0] === 400)) {
          weightFragment = '';
        } else {
          weightFragment = `:wght@${weightValues.sort().join(';')}`;
        }
        return `family=${encodeURIComponent(familyName)}${weightFragment}`;
      })
      .join('&');
    resources[indexHtmlPath] = resources[indexHtmlPath].replace(
      '</head>',
      `  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link href="https://fonts.googleapis.com/css2?${familyUrlFragment}&display=swap" rel="stylesheet">\n</head>`,
    );
  }
}
