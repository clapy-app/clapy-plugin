import axios from 'axios';
import { createWriteStream } from 'fs';
import { lstat, mkdir, readdir, rmdir, unlink, writeFile } from 'fs/promises';
import JSZip from 'jszip';
import { dirname, join, resolve } from 'path';
import * as stream from 'stream';
import { promisify } from 'util';

import { flags } from '../../env-and-config/app-config.js';
import { env } from '../../env-and-config/env.js';
import { backendDir, dockerPluginCompDir } from '../../root.js';
import type { CSBResponse } from '../sb-serialize-preview/sb-serialize.model.js';
import type { CodeDict, CsbDict, ModuleContext } from './code.model.js';

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

export async function makeZip(files: CsbDict) {
  // Sample from: https://stuk.github.io/jszip/ - repo: https://github.com/Stuk/jszip
  const zip = new JSZip();

  const promises = [];

  for (let [path, { content, isBinary }] of Object.entries(files)) {
    // If isBinary, fetch the resources and add to zip
    if (isBinary) {
      promises.push(
        // To get all content at once with promise, use 'arraybuffer'
        axios.get(content, { responseType: 'stream' /* 'arraybuffer' */ }).then(({ data }) => {
          zip.file(path, data);
        }),
      );
    } else {
      zip.file(path, content);
    }
  }

  await Promise.all(promises);

  // To get all content at once with promise, use zip.generateAsync({ type: 'uint8array' })
  const content = zip.generateNodeStream();
  return content;
}

const srcCompPrefix = 'src/components/';

export async function writeToDisk(
  files: CsbDict,
  moduleContext: ModuleContext | undefined,
  isClapyFile: boolean | undefined,
) {
  const glob = (await import('glob')).default;
  const globPromise = promisify(glob);
  const { compName } = moduleContext || {};

  const filePaths: string[] = [];
  const filesToWrite: CodeDict = {};
  await Promise.all(
    Object.entries(files).map(async ([path, { content, isBinary }]) => {
      const files = [`${backendDir}/atest-gen/${path}`];
      if (flags.writeClapyFiles && isClapyFile && path.startsWith(srcCompPrefix)) {
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
  ];
  if (moduleContext?.projectContext.extraConfig.framework === 'react') {
    // public
    dirsToClean.push(`${backendDir}/atest-gen/public`);
  }
  if (flags.writeClapyFiles && isClapyFile && compName) {
    // clapy plugin
    dirsToClean.push(`${dockerPluginCompDir}/${compName}`);
  }

  // Is a delay useful here to wait for webpack to rebuild first?

  // Remove extra files
  try {
    const globsToClean = dirsToClean.map(dir => `${dir}/**/*.*`);
    const [srcMatches, publicMatches, clapyMatches] = await Promise.all(
      globsToClean.map(g => globPromise(resolve(g), { ignore: filePaths })),
    );
    await Promise.all([...srcMatches, ...(publicMatches || []), ...(clapyMatches || [])].map(match => unlink(match)));

    // Then remove empty folders
    await Promise.all(dirsToClean.map(dir => cleanEmptyFoldersRecursively(dir)));
  } catch (error) {
    // Warn, because some file system errors don't leave any stack trace, which makes it harder to find the code throwing the error just from the error description.
    console.warn(
      'It seems a file to delete or directory to clean does not exist. Add a breakpoint here for investigation.',
    );
    throw error;
  }
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
