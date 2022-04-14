import axios from 'axios';
import { createWriteStream } from 'fs';
import { lstat, mkdir, readdir, rmdir, unlink, writeFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import * as stream from 'stream';
import { promisify } from 'util';

import { env } from '../../env-and-config/env';
import { backendDir, dockerPluginCompDir } from '../../root';
import { CSBResponse } from '../sb-serialize-preview/sb-serialize.model';
import { CsbDict } from './code.model';

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

export async function writeToDisk(files: CsbDict, isClapyFile: boolean) {
  const glob = require('glob');
  const globPromise = promisify(glob);

  const filePaths: string[] = [];
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
        files.push(`${dockerPluginCompDir}/${path.substring(srcCompPrefix.length)}`);
      }

      await Promise.all(
        files.map(async file => {
          file = resolve(file);
          const dir = resolve(dirname(file));
          filePaths.push(file);
          await mkdir(dir, { recursive: true });
          if (!isBinary) {
            await writeFile(file, content);
          } else {
            await downloadFile(content, file);
          }
        }),
      );
    }),
  );

  // Remove old files
  const globsToClean = [
    globPromise(resolve(`${backendDir}/atest-gen/src/**/*.*`), { ignore: filePaths }),
    globPromise(resolve(`${backendDir}/atest-gen/public/**/*.*`), { ignore: filePaths }),
  ];
  if (isClapyFile) {
    globsToClean.push(globPromise(resolve(`${dockerPluginCompDir}/**/*.*`), { ignore: filePaths }));
  }
  const [srcMatches, publicMatches, clapyMatches] = await Promise.all(globsToClean);
  await Promise.all([...srcMatches, ...publicMatches, ...(clapyMatches || [])].map(match => unlink(match)));
  // Then remove empty folders
  await Promise.all([
    cleanEmptyFoldersRecursively(`${backendDir}/atest-gen/src`),
    cleanEmptyFoldersRecursively(`${backendDir}/atest-gen/public`),
  ]);
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
