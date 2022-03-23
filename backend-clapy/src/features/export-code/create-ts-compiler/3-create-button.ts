import { readFile } from 'fs/promises';
import { Project } from 'ts-morph';

import { exportTemplatesDir } from '../../../root';

export const componentTemplatePathTsx = `${exportTemplatesDir}/react-comp/CompTemplate.tsx`;
export const componentTemplatePathCss = `${exportTemplatesDir}/react-comp/CompTemplate.module.css`;

export async function createButton(project: Project) {
  const componentTemplateTsx = await readFile(componentTemplatePathTsx, { encoding: 'utf8' });
  const componentTemplateCss = await readFile(componentTemplatePathCss, { encoding: 'utf8' });
  const tsx = project.createSourceFile(
    'src/components/Button/Button.tsx',
    componentTemplateTsx /*, { overwrite: true }*/,
  );
  const css = project.createSourceFile(
    'src/components/Button/Button.module.css',
    componentTemplateCss /*, { overwrite: true }*/,
  );
  return tsx;
  // console.log(project.getSourceFile('src/components/Button/Button.tsx')?.getFullText());
}
