// import * as csstree from 'css-tree';
// import { parse } from 'css-tree';
import { readFile } from 'fs/promises';
import { Project, SourceFile } from 'ts-morph';

import { NodeContext } from '../code.model';
import { genUniqueName } from '../figma-code-map/details/ts-ast-utils';
import { BaseNode2 } from './canvas-utils';
import { componentTemplatePathTsx } from './load-file.utils';

export function getCompDirectory(compName: string) {
  return `src/components/${compName}`;
}

// Both variables must be consistent.
export const assetsResourceDir = `public/assets/`;
// Here, '', '/' or '.' points to the public directory.
export const assetsCssBaseUrl = 'assets/';

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

export function writeAsset(context: NodeContext, node: BaseNode2, extension: string, content: string) {
  const {
    componentContext: { projectContext },
  } = context;
  const assetName = genUniqueName(projectContext.assetsAlreadyUsed, node.name);
  const imageFileName = `${assetName}.${extension}`;

  // Write image in assets directory - the clean solution
  // projectContext.resources[`${assetsPath}/${imageFileName}`] = imageEntry.url;
  // bgImages.push(`url("../../${assetsDirName}/${imageFileName}")`);

  // Write image in public directory - the codesandbox workaround
  projectContext.resources[`${assetsResourceDir}/${imageFileName}`] = content;

  const assetCssUrl = `${assetsCssBaseUrl}${imageFileName}`;
  return assetCssUrl;
}
