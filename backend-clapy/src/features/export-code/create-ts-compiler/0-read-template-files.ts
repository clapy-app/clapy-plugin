import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

import type { CodeDict } from '../code.model.js';

const ignoredFilesAndDir = new Set([
  'node_modules',
  'yarn.lock',
  'favicon.ico',
  '.pnp.cjs',
  '.pnp.loader.mjs',
  '.yarn',
  '.yarnrc',
]);

export async function readTemplateFiles(directory: string, base = '', files: CodeDict = {}) {
  for (const fileOrDir of await readdir(directory)) {
    if (ignoredFilesAndDir.has(fileOrDir)) {
      continue;
    }
    const path = join(directory, fileOrDir);
    if ((await stat(path)).isDirectory()) {
      await readTemplateFiles(path, `${base}${fileOrDir}/`, files);
    } else {
      let content = await readTemplateFile(path);
      // if (fileOrDir.endsWith('.json')) {
      //   content = JSON.parse(content);
      // }
      files[`${base}${fileOrDir}`] = content;
    }
  }
  return files;
}

export async function readTemplateFile(path: string) {
  return readFile(path, { encoding: 'utf-8' });
}
