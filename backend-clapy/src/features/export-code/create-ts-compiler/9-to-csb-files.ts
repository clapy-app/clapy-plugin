import type { CodeDict, CsbDict } from '../code.model.js';

export function toCSBFiles(...files: CodeDict[]) {
  const csbFiles: CsbDict = {};
  for (const resource of files) {
    for (const [path, content] of Object.entries(resource)) {
      csbFiles[path] = { content };

      if (isBinaryUrl(content)) {
        csbFiles[path].isBinary = true;
      }
    }
  }
  return csbFiles;
}

function isBinaryUrl(content: string) {
  return content.startsWith('https://');
}
