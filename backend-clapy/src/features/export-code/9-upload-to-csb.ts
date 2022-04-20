import axios from 'axios';
import { createWriteStream } from 'fs';
import { lstat, mkdir, readdir, rmdir, unlink, writeFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import * as stream from 'stream';
import { promisify } from 'util';

import { env } from '../../env-and-config/env';
import { backendDir, dockerPluginCompDir } from '../../root';
import { CSBResponse } from '../sb-serialize-preview/sb-serialize.model';
import { CodeDict, ComponentContext, CsbDict } from './code.model';

export async function uploadToCSB(files: CsbDict) {
  const { data } = await axios.post<CSBResponse>('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
    files,
  });
  if (env.isDev && data) {
    console.log(`Preview: https://${data.sandbox_id}.csb.app`);
    console.log(`Edit: https://codesandbox.io/s/${data.sandbox_id}`);
  }
  return data;
}

const srcCompPrefix = 'src/components/';

export async function writeToDisk(files: CsbDict, componentContext: ComponentContext, isClapyFile: boolean) {
  const glob = require('glob');
  const globPromise = promisify(glob);
  const { compName } = componentContext;

  const filePaths: string[] = [];
  const filesToWrite: CodeDict = {};
  await Promise.all(
    Object.entries(files).map(async ([path, { content, isBinary }]) => {
      if (!content) {
        console.warn('BUG No content at path', path);
        if (isBinary) {
          console.warn('(is binary)');
        }
        return;
      }

      const files = [`${backendDir}/atest-gen/${path}`];
      if (isClapyFile && path.startsWith(srcCompPrefix)) {
        const file = `${dockerPluginCompDir}/${path.substring(srcCompPrefix.length)}`;
        const dir = resolve(dirname(file));
        await mkdir(dir, { recursive: true });
        files.push(file);
      }

      await Promise.all(
        files.map(async file => {
          file = resolve(file);
          const dir = resolve(dirname(file));
          filePaths.push(file);
          await mkdir(dir, { recursive: true });
          if (!isBinary) {
            filesToWrite[file] = content;
          } else {
            await downloadFile(content, file);
          }
        }),
      );
    }),
  );
  // Write all files in parallel here to avoid webpack bugs, not detecting some files while re-bundling because they are written too late.
  await Promise.all(Object.entries(filesToWrite).map(([path, content]) => writeFile(path, content)));

  // List files and directories to clean up
  const dirsToClean = [
    // src
    `${backendDir}/atest-gen/src`,
    // public
    `${backendDir}/atest-gen/public`,
  ];
  if (isClapyFile) {
    // clapy plugin
    dirsToClean.push(`${dockerPluginCompDir}/${compName}`);
  }

  // Is a delay useful here to wait for webpack to rebuild first?

  // Remove extra files
  const globsToClean = dirsToClean.map(dir => `${dir}/**/*.*`);
  const [srcMatches, publicMatches, clapyMatches] = await Promise.all(
    globsToClean.map(g => globPromise(resolve(g), { ignore: filePaths })),
  );
  await Promise.all([...srcMatches, ...publicMatches, ...(clapyMatches || [])].map(match => unlink(match)));

  // Then remove empty folders
  await Promise.all(dirsToClean.map(dir => cleanEmptyFoldersRecursively(dir)));
}

const finished = promisify(stream.finished);

export async function downloadFile(fileUrl: string, outputLocationPath: string) {
  const writer = createWriteStream(outputLocationPath);
  return axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  }).then(async response => {
    response.data.pipe(writer);
    return finished(writer);
  });
}

async function cleanEmptyFoldersRecursively(folder: string) {
  const isDir = (await lstat(folder)).isDirectory();
  if (!isDir) {
    return;
  }
  let files = await readdir(folder);
  if (files.length > 0) {
    await Promise.all(
      files.map(file => {
        const fullPath = join(folder, file);
        return cleanEmptyFoldersRecursively(fullPath);
      }),
    );

    // re-evaluate files; after deleting subfolder
    // we may have parent folder empty now
    files = await readdir(folder);
  }

  if (files.length == 0) {
    await rmdir(folder);
    return;
  }
}
