// import * as csstree from 'css-tree';
// import { parse } from 'css-tree';
import { readFile } from 'fs/promises';
import { Project, SourceFile } from 'ts-morph';

import { exportTemplatesDir } from '../../../root';

export const componentTemplatePathTsx = `${exportTemplatesDir}/react-comp/CompTemplate.tsx`;
export const componentTemplatePathCss = `${exportTemplatesDir}/react-comp/CompTemplate.module.css`;

export async function createComponent(project: Project, name: string) {
  // TypeScript
  const componentTemplateTsx = await readFile(componentTemplatePathTsx, { encoding: 'utf8' });
  const tsx = project.createSourceFile(
    `src/components/${name}/${name}.tsx`,
    componentTemplateTsx /*, { overwrite: true }*/,
  );
  updateCssImport(tsx, name);

  return tsx;
}

function updateCssImport(file: SourceFile, name: string) {
  const declaration = file.getImportDeclarationOrThrow(
    declaration => declaration.getModuleSpecifierValue() === './CompTemplate.module.css',
  );
  declaration.setModuleSpecifier(`./${name}.module.css`);
}

function updateFunctionName(file: SourceFile, name: string) {}
