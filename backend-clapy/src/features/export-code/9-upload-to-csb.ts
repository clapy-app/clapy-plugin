import axios from 'axios';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';

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
  Promise.all(
    Object.entries(files).map(async ([path, { content }]) => {
      const dir = resolve(`${backendDir}/atest-gen/${dirname(path)}`);
      const file = resolve(`${backendDir}/atest-gen/${path}`);
      // console.log('Create:', file);
      await mkdir(dir, { recursive: true });
      return writeFile(file, content);
    }),
  );
}
