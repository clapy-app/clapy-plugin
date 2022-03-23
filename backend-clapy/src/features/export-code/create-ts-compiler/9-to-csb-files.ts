import { Project } from 'ts-morph';

import { CodeDict, CsbDict } from '../code.model';

export function toCSBFiles(project: Project, cssFiles: CodeDict) {
  const files: CsbDict = {};
  for (const file of project.getSourceFiles()) {
    const path = file.getFilePath();
    files[path.startsWith('/') ? path.substring(1) : path] = { content: file.getFullText() };
  }
  for (const [path, css] of Object.entries(cssFiles)) {
    files[path] = { content: css };
  }
  return files;
}
