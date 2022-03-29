import { CodeDict, CsbDict } from '../code.model';

export function toCSBFiles(...files: CodeDict[]) {
  const csbFiles: CsbDict = {};
  for (const resource of files) {
    for (const [path, css] of Object.entries(resource)) {
      csbFiles[path] = { content: css };
    }
  }
  return csbFiles;
}
