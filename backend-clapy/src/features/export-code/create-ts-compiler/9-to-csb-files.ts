import { Project } from 'ts-morph';

import { CsbDict } from '../code.model';

export function toCSBFiles(project: Project) {
  const files: CsbDict = {};
  for (const file of project.getSourceFiles()) {
    files[file.getFilePath()] = { content: file.getFullText() };
  }
  return files;
}
