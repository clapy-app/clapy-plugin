import { Project, ts } from 'ts-morph';

import { perfMeasure } from '../../common/perf-utils';
import { env } from '../../env-and-config/env';
import { ExportCodePayload, SceneNodeNoMethod } from '../sb-serialize-preview/sb-serialize.model';
import { figmaToAstRootNode } from './4-figma-to-ast-root';
import { diagnoseFormatTsFiles, prepareCssFiles } from './8-diagnose-format-ts-files';
import { uploadToCSB, writeToDisk } from './9-upload-to-csb';
import { CodeDict, ComponentContext, ProjectContext } from './code.model';
import { readReactTemplateFiles } from './create-ts-compiler/0-read-template-files';
import { createProjectFromTsConfig, separateTsAndResources } from './create-ts-compiler/1-create-compiler-project';
import { addFilesToProject } from './create-ts-compiler/2-add-files-to-project';
import { createComponent, getCompDirectory } from './create-ts-compiler/3-create-component';
import { toCSBFiles } from './create-ts-compiler/9-to-csb-files';
import { getFirstExportedComponentsInFileOrThrow } from './create-ts-compiler/parsing.utils';
import { addRulesToAppCss } from './css-gen/addRulesToAppCss';
import { cssAstToString } from './css-gen/css-factories-low';
import { genUniqueName, mkFragment } from './figma-code-map/details/ts-ast-utils';

const appCssPath = 'src/App.module.css';
const indexHtmlPath = 'public/index.html';

export async function exportCode(figmaConfig: ExportCodePayload, skipCsbUpload = false) {
  try {
    // Initialize the project template with base files
    perfMeasure('a');
    const filesCsb = await readReactTemplateFiles();
    perfMeasure('b');
    const { 'tsconfig.json': tsConfig, ...rest } = filesCsb;
    perfMeasure('c');
    const project = await createProjectFromTsConfig(tsConfig);
    perfMeasure('d');
    const [files, { [appCssPath]: appCss, ...resources }] = separateTsAndResources(rest);
    const cssFiles: CodeDict = { [appCssPath]: appCss };
    perfMeasure('e');
    resources['tsconfig.json'] = tsConfig;
    addFilesToProject(project, files);
    perfMeasure('f');

    // Most context elements here should be per component (but not compNamesAlreadyUsed).
    // When we have multiple components, we should split in 2 locations to initialize the context (global vs per component)
    const projectContext: ProjectContext = {
      compNamesAlreadyUsed: new Set(),
      fontFamiliesUsed: new Set(),
      resources,
      cssFiles,
      images: figmaConfig.images,
      // project // if useful
    };

    const compName = genUniqueName(projectContext.compNamesAlreadyUsed, figmaConfig.root.name, true);

    const componentContext: ComponentContext = {
      projectContext,
      file: await createComponent(project, compName),
      compName,
      classNamesAlreadyUsed: new Set(),
      importNamesAlreadyUsed: new Set(),
      cssRules: [],
      inInteractiveElement: false,
    };

    await addComponentToProject(componentContext, figmaConfig, cssFiles);
    perfMeasure('g');

    addCompToAppRoot(project, componentContext, figmaConfig.parent);
    perfMeasure('h');

    const tsFiles = await diagnoseFormatTsFiles(project);
    perfMeasure('i');
    await prepareCssFiles(cssFiles);
    // prepareResources(resources);

    addFontsToIndexHtml(projectContext);

    const csbFiles = toCSBFiles(tsFiles, cssFiles, resources);
    perfMeasure('j');
    if (env.isDev) {
      // Useful for the dev in watch mode. Uncomment when needed.
      // console.log(csbFiles[`src/components/${compName}/${compName}.module.css`].content);
      // console.log(csbFiles[`src/components/${compName}/${compName}.tsx`].content);
      //
      // console.log(project.getSourceFile('/src/App.tsx')?.getFullText());
      await writeToDisk(csbFiles);
      perfMeasure('k');
    }
    if (!skipCsbUpload) {
      const csbResponse = await uploadToCSB(csbFiles);
      perfMeasure('l');
      return csbResponse;
    }
  } catch (error: any) {
    console.error(error.stack);
  }
}

async function addComponentToProject(
  componentContext: ComponentContext,
  figmaConfig: ExportCodePayload,
  cssFiles: CodeDict,
) {
  const { file, compName } = componentContext;
  perfMeasure('g1');

  // Get the returned expression that we want to replace
  const { returnedExpression, compDeclaration } = getFirstExportedComponentsInFileOrThrow(file);
  perfMeasure('g2');
  compDeclaration.getNameNodeOrThrow().replaceWithText(compName);
  perfMeasure('g3');

  const [tsx, css] = await figmaToAstRootNode(componentContext, figmaConfig);
  perfMeasure('g4');

  // Replace the returned expression with the newly generated code
  returnedExpression.transform((/* traversal */) => {
    // traversal.currentNode
    // traversal.visitChildren()
    return (Array.isArray(tsx) ? mkFragment(tsx) : tsx) || ts.factory.createNull();
  });
  perfMeasure('g5');

  // Add CSS file.
  cssFiles[`${getCompDirectory(compName)}/${compName}.module.css`] = cssAstToString(css);
  perfMeasure('g6');
}

function addCompToAppRoot(project: Project, componentContext: ComponentContext, parentNode: SceneNodeNoMethod) {
  const {
    compName,
    projectContext: { cssFiles },
  } = componentContext;
  const appFile = project.getSourceFileOrThrow('src/App.tsx');
  appFile.addImportDeclaration({
    moduleSpecifier: `./components/${compName}/${compName}`,
    namedImports: [compName],
  });

  const updatedAppCss = addRulesToAppCss(cssFiles[appCssPath], parentNode);
  if (updatedAppCss) {
    cssFiles[appCssPath] = updatedAppCss;
  }

  // TODO We can add a couple of attributes from parentNode into App.module.css's root class. If useful.

  const { jsx } = getFirstExportedComponentsInFileOrThrow(appFile);
  jsx.transform(traversal => {
    const node = traversal.currentNode;
    if (!isJsxElement(node)) {
      throw new Error(`jsx first tag is not a JsxElement in App.tsx, bug.`);
    }
    const { openingElement, closingElement } = node;
    const { factory } = ts;
    return factory.createJsxElement(
      openingElement,
      [
        factory.createJsxSelfClosingElement(
          factory.createIdentifier(compName),
          undefined,
          factory.createJsxAttributes([]),
        ),
      ],
      closingElement,
    );
  });
}

function isJsxElement(node: ts.Node): node is ts.JsxElement {
  return node.kind === ts.SyntaxKind.JsxElement;
}

function addFontsToIndexHtml(projectContext: ProjectContext) {
  const { fontFamiliesUsed, resources } = projectContext;
  if (fontFamiliesUsed.size) {
    const familyUrlFragment = Array.from(fontFamiliesUsed.values())
      .map(name => `family=${encodeURIComponent(name)}`)
      .join('&');
    resources[indexHtmlPath] = resources[indexHtmlPath].replace(
      '</head>',
      `  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link href="https://fonts.googleapis.com/css2?${familyUrlFragment}&display=swap" rel="stylesheet">\n</head>`,
    );
  }
}
