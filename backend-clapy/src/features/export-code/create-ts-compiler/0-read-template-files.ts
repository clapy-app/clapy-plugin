import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

import { CodeDict, CsbDict } from '../code.model';
import { reactTemplateDir } from './load-file-utils-and-paths';

const ignoredFilesAndDir = new Set(['node_modules', 'yarn.lock', 'favicon.ico']);

// const csbReactTemplateFiles = readCSBReactTemplateFiles(reactTemplateDir).catch(e => {
//   console.error('Could not read files to use for codesandbox. There is a blocking bug to fix.');
//   throw e;
// });

// Still useful?
export async function readCSBReactTemplateFiles(directory = reactTemplateDir, base = '', files: CsbDict = {}) {
  for (const fileOrDir of await readdir(directory)) {
    if (ignoredFilesAndDir.has(fileOrDir)) {
      continue;
    }
    const path = join(directory, fileOrDir);
    if ((await stat(path)).isDirectory()) {
      await readCSBReactTemplateFiles(path, `${base}${fileOrDir}/`, files);
    } else {
      let content = await readFile(path, { encoding: 'utf-8' });
      // if (fileOrDir.endsWith('.json')) {
      //   content = JSON.parse(content);
      // }
      files[`${base}${fileOrDir}`] = { content };
    }
  }
  return files;
}

export async function readReactTemplateFiles(directory = reactTemplateDir, base = '', files: CodeDict = {}) {
  for (const fileOrDir of await readdir(directory)) {
    if (ignoredFilesAndDir.has(fileOrDir)) {
      continue;
    }
    const path = join(directory, fileOrDir);
    if ((await stat(path)).isDirectory()) {
      await readReactTemplateFiles(path, `${base}${fileOrDir}/`, files);
    } else {
      let content = await readFile(path, { encoding: 'utf-8' });
      // if (fileOrDir.endsWith('.json')) {
      //   content = JSON.parse(content);
      // }
      files[`${base}${fileOrDir}`] = content;
    }
  }
  return files;
}

// async function test() {
//   console.log('-----------', reactTemplateDir);
//   const files = await readCSBReactTemplateFiles(reactTemplateDir);
//   console.log(files);
//   console.log('-----------');
// }
// test().catch(handleError);
