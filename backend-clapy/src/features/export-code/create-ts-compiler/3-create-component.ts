// import * as csstree from 'css-tree';
// import { parse } from 'css-tree';
import { readFile } from 'fs/promises';
import { Project, SourceFile } from 'ts-morph';

import { componentTemplatePathTsx } from './load-file.utils';

export function getCompDirectory(compName: string) {
  return `src/components/${compName}`;
}

export const assetsDirName = 'assets';
export const assetsPath = `src/${assetsDirName}`;

// Copy the component template in project: placeholder to write the button code later
export async function createComponent(project: Project, name: string) {
  // TypeScript
  const componentTemplateTsx = await readFile(componentTemplatePathTsx, { encoding: 'utf8' });
  const fileAst = project.createSourceFile(
    `${getCompDirectory(name)}/${name}.tsx`,
    componentTemplateTsx /*, { overwrite: true }*/,
  );
  updateCssImport(fileAst, name);

  return fileAst;
}

function updateCssImport(file: SourceFile, name: string) {
  const declaration = file.getImportDeclarationOrThrow(
    declaration => declaration.getModuleSpecifierValue() === './CompTemplate.module.css',
  );
  declaration.setModuleSpecifier(`./${name}.module.css`);
}

function updateFunctionName(file: SourceFile, name: string) {}
