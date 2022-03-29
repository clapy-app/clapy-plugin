import { Project, ts } from 'ts-morph';

import { perfMeasure } from '../../common/perf-utils';
import { env } from '../../env-and-config/env';
import { SceneNodeNoMethod } from '../sb-serialize-preview/sb-serialize.model';
import { figmaToAstRootNode } from './4-figma-to-ast-root';
import { diagnoseFormatTsFiles, prepareCssFiles } from './8-diagnose-format-ts-files';
import { uploadToCSB, writeToDisk } from './9-upload-to-csb';
import { CodeDict, ComponentContext, ProjectContext } from './code.model';
import { readReactTemplateFiles } from './create-ts-compiler/0-read-template-files';
import { createProjectFromTsConfig, separateTsAndResources } from './create-ts-compiler/1-create-compiler-project';
import { addFilesToProject } from './create-ts-compiler/2-add-files-to-project';
import { createComponent } from './create-ts-compiler/3-create-component';
import { toCSBFiles } from './create-ts-compiler/9-to-csb-files';
import { getFirstExportedComponentsInFileOrThrow, printStandalone } from './create-ts-compiler/parsing.utils';
import { cssAstToString } from './css-gen/css-factories-low';
import { genUniqueName, mkFragment } from './figma-code-map/details/ts-ast-utils';

export async function tryIt2_createTsProjectCompiler(figmaConfig: SceneNodeNoMethod) {
  // await wait(2000);
  const projectContext: ProjectContext = {
    compNamesAlreadyUsed: new Set(),
  };
  const componentContext: ComponentContext = {
    projectContext,
    classNamesAlreadyUsed: new Set(),
    cssRules: [],
    inInteractiveElement: false,
  };
  const [tsx, css] = figmaToAstRootNode(componentContext, figmaConfig);

  console.log(printStandalone(tsx));
  console.log(cssAstToString(css));
}

export async function exportCode(figmaConfig: SceneNodeNoMethod, skipCsbUpload = false) {
  try {
    // Most context elements here should be per component (but not compNamesAlreadyUsed).
    // When we have multiple components, we should split in 2 locations to initialize the context (global vs per component)
    const projectContext: ProjectContext = {
      compNamesAlreadyUsed: new Set(),
    };
    const componentContext: ComponentContext = {
      projectContext,
      classNamesAlreadyUsed: new Set(),
      cssRules: [],
      inInteractiveElement: false,
    };
    // Initialize the project template with base files
    perfMeasure('a');
    const filesCsb = await readReactTemplateFiles();
    perfMeasure('b');
    const { 'tsconfig.json': tsConfig, ...rest } = filesCsb;
    perfMeasure('c');
    const project = await createProjectFromTsConfig(tsConfig);
    perfMeasure('d');
    const cssFiles: CodeDict = {};
    const [files, resources] = separateTsAndResources(rest);
    perfMeasure('e');
    resources['tsconfig.json'] = tsConfig;
    addFilesToProject(project, files);
    perfMeasure('f');

    const compName = genUniqueName(projectContext.compNamesAlreadyUsed, figmaConfig.name, true); // 'Button' - need to dedupe and find smarter names later

    await addComponentToProject(componentContext, figmaConfig, project, cssFiles, compName);
    perfMeasure('g');

    addCompToAppRoot(project, compName);
    perfMeasure('h');

    const tsFiles = await diagnoseFormatTsFiles(project);
    perfMeasure('i');
    await prepareCssFiles(cssFiles);
    // prepareResources(resources);

    const csbFiles = toCSBFiles(tsFiles, cssFiles, resources);
    perfMeasure('j');
    console.log(csbFiles[`src/components/${compName}/${compName}.module.css`].content);
    console.log(csbFiles[`src/components/${compName}/${compName}.tsx`].content);
    //
    // console.log(project.getSourceFile('/src/App.tsx')?.getFullText());
    if (env.isDev) {
      await writeToDisk(csbFiles);
      perfMeasure('k');
    }
    if (!skipCsbUpload) {
      const csbResponse = await uploadToCSB(csbFiles);
      perfMeasure('l');
      return csbResponse;
    }
  } catch (error) {
    console.error(error);
  }
}

async function addComponentToProject(
  componentContext: ComponentContext,
  figmaConfig: SceneNodeNoMethod,
  project: Project,
  cssFiles: CodeDict,
  compName: string,
) {
  // Copy the component template in project: placeholder to write the button code later
  const buttonFile = await createComponent(project, compName);
  perfMeasure('g1');

  // Get the returned expression that we want to replace
  const { returnedExpression, compDeclaration } = getFirstExportedComponentsInFileOrThrow(buttonFile);
  perfMeasure('g2');
  compDeclaration.getNameNodeOrThrow().replaceWithText(compName);
  perfMeasure('g3');

  const [tsx, css] = figmaToAstRootNode(componentContext, figmaConfig);
  perfMeasure('g4');

  // Replace the returned expression with the newly generated code
  returnedExpression.transform((/* traversal */) => {
    // traversal.currentNode
    // traversal.visitChildren()
    return (Array.isArray(tsx) ? mkFragment(tsx) : tsx) || ts.factory.createNull();
  });
  perfMeasure('g5');

  // Add CSS file.
  cssFiles[`src/components/${compName}/${compName}.module.css`] = cssAstToString(css);
  perfMeasure('g6');
}

function addCompToAppRoot(project: Project, compName: string) {
  const appFile = project.getSourceFileOrThrow('src/App.tsx');
  appFile.addImportDeclaration({
    moduleSpecifier: `./components/${compName}/${compName}`,
    namedImports: [compName],
  });

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

export function createTsProjectCompiler() {}
