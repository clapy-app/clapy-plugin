import { ScriptTarget, ts } from 'ts-morph';

import { SceneNodeNoMethod } from '../sb-serialize-preview/sb-serialize.model';
import { readReactTemplateFiles } from './2-read-template-files';
import { figmaToAst } from './4-figma-to-ast';
import { createProjectFromTsConfig, mapCsbFilesToCompilerFormat } from './create-ts-compiler/1-create-compiler-project';
import { addFilesToProject } from './create-ts-compiler/2-add-files-to-project';
import { createButton } from './create-ts-compiler/3-create-button';
import { toCSBFiles } from './create-ts-compiler/9-to-csb-files';
import { getFirstExportedComponentsInFileOrThrow } from './create-ts-compiler/parsing.utils';

export async function tryIt2_createTsProjectCompiler(figmaConfig: SceneNodeNoMethod) {
  const ast = figmaToAst(figmaConfig);

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const result = printer.printNode(
    ts.EmitHint.Unspecified,
    ast,
    ts.createSourceFile('foo.ts', '', ScriptTarget.ESNext, true),
  );
  console.log(result);
}

export async function tryIt_createTsProjectCompiler(figmaConfig: SceneNodeNoMethod) {
  try {
    // Initialize the project template with base files
    const filesCsb = await readReactTemplateFiles();
    const { 'tsconfig.json': tsConfig, ...rest } = filesCsb;
    const project = createProjectFromTsConfig(tsConfig);
    const files = mapCsbFilesToCompilerFormat(rest);
    addFilesToProject(project, files);

    // Copy the component template in project: placeholder to write the button code later
    const buttonFile = await createButton(project);

    // Get the returned expression that we want to replace
    const { returnedExpression } = getFirstExportedComponentsInFileOrThrow(buttonFile);

    const ast = figmaToAst(figmaConfig);

    // Replace the returned expression with the newly generated code
    returnedExpression.transform((/* traversal */) => {
      // traversal.currentNode
      // traversal.visitChildren()
      return ast;
    });

    console.log(buttonFile.getFullText());
    const csbFiles = toCSBFiles(project);
    //
    // console.log(project.getSourceFile('/src/App.tsx')?.getFullText());
    // const data = await uploadToCSB(csbFiles);
  } catch (error) {
    console.error(error);
  }
}

export function createTsProjectCompiler() {}
