import axios from 'axios';
import { createWriteStream } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import * as stream from 'stream';
import { promisify } from 'util';

import { env } from '../../env-and-config/env';
import { backendDir } from '../../root';
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

export async function writeToDisk(files: CsbDict) {
  // Should remove extra files after writing updates to avoid breaking the webpack watch.
  await Promise.all([
    // rm(`${backendDir}/atest-gen/src/components`, { recursive: true, force: true }),
    // rm(`${backendDir}/atest-gen/public`, { recursive: true, force: true }),
    // rm(`${backendDir}/atest-gen/package.json`, { recursive: true, force: true }),
    // rm(`${backendDir}/atest-gen/tsconfig.json`, { recursive: true, force: true }),
  ]);
  return Promise.all(
    Object.entries(files).map(async ([path, { content, isBinary }]) => {
      if (!content) {
        console.warn('BUG No content at path', path);
        if (isBinary) {
          console.warn('(is binary)');
        }
        return;
      }
      const dir = resolve(`${backendDir}/atest-gen/${dirname(path)}`);
      const file = resolve(`${backendDir}/atest-gen/${path}`);
      // console.log('Create:', file);
      await mkdir(dir, { recursive: true });
      if (!isBinary) {
        return writeFile(file, content);
      } else {
        return downloadFile(content, file);
      }
    }),
  );
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
