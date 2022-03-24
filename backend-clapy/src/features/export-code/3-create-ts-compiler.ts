import { Project, ts } from 'ts-morph';

import { SceneNodeNoMethod } from '../sb-serialize-preview/sb-serialize.model';
import { readReactTemplateFiles } from './2-read-template-files';
import { figmaToAst } from './4-figma-to-ast';
import { CodeDict } from './code.model';
import { createProjectFromTsConfig, mapCsbFilesToCompilerFormat } from './create-ts-compiler/1-create-compiler-project';
import { addFilesToProject } from './create-ts-compiler/2-add-files-to-project';
import { createComponent } from './create-ts-compiler/3-create-component';
import { toCSBFiles } from './create-ts-compiler/9-to-csb-files';
import { getFirstExportedComponentsInFileOrThrow, printStandalone } from './create-ts-compiler/parsing.utils';
import { cssAstToString } from './css-gen/css-factories';

export async function tryIt2_createTsProjectCompiler(figmaConfig: SceneNodeNoMethod) {
  // await wait(2000);
  const [tsx, css] = figmaToAst(figmaConfig);

  console.log(printStandalone(tsx));
  console.log(cssAstToString(css));
}

export async function exportCode(figmaConfig: SceneNodeNoMethod) {
  try {
    // Initialize the project template with base files
    const filesCsb = await readReactTemplateFiles();
    const { 'tsconfig.json': tsConfig, ...rest } = filesCsb;
    const project = createProjectFromTsConfig(tsConfig);
    const cssFiles: CodeDict = {};
    const files = mapCsbFilesToCompilerFormat(rest);
    addFilesToProject(project, files);

    const compName = figmaConfig.name; // 'Button' - need to dedupe and find smarter names later

    await addComponentToProject(figmaConfig, project, cssFiles, compName);

    addCompToAppRoot(project, compName);

    const csbFiles = toCSBFiles(project, cssFiles);
    console.log(csbFiles[`src/components/${compName}/${compName}.module.css`].content);
    console.log(csbFiles[`src/components/${compName}/${compName}.tsx`].content);
    //
    // console.log(project.getSourceFile('/src/App.tsx')?.getFullText());
    // return await uploadToCSB(csbFiles);
  } catch (error) {
    console.error(error);
  }
}

async function addComponentToProject(
  figmaConfig: SceneNodeNoMethod,
  project: Project,
  cssFiles: CodeDict,
  compName: string,
) {
  // Copy the component template in project: placeholder to write the button code later
  const buttonFile = await createComponent(project, compName);

  // Get the returned expression that we want to replace
  const { returnedExpression, compDeclaration } = getFirstExportedComponentsInFileOrThrow(buttonFile);
  compDeclaration.rename(compName);

  const [tsx, css] = figmaToAst(figmaConfig);

  // Replace the returned expression with the newly generated code
  returnedExpression.transform((/* traversal */) => {
    // traversal.currentNode
    // traversal.visitChildren()
    return tsx;
  });

  // Add CSS file.
  cssFiles[`src/components/${compName}/${compName}.module.css`] = cssAstToString(css);
}

function addCompToAppRoot(project: Project, compName: string) {
  const appFile = project.getSourceFileOrThrow('src/App.tsx');
  appFile.addImportDeclaration({
    moduleSpecifier: `./components/${compName}/${compName}`,
    namedImports: ['Button'],
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
          factory.createIdentifier('Button'),
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
