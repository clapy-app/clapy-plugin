import { CodeDict, CsbDict } from '../code.model';

export function toCSBFiles(...files: CodeDict[]) {
  const csbFiles: CsbDict = {};
  for (const resource of files) {
    for (const [path, content] of Object.entries(resource)) {
      csbFiles[path] = { content };

      if (!content) {
        if (!path.endsWith('css')) {
          console.warn('[toCSBFiles] No content at', path);
        }
      } else if (content.startsWith('https://')) {
        csbFiles[path].isBinary = true;
      }
    }
  }
  return csbFiles;
}
