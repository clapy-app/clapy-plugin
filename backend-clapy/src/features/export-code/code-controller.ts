import { Body, Controller, Post } from '@nestjs/common';
import axios from 'axios';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

import { reactTemplateDir } from '../../root';
import { CSBResponse, Dict, SceneNodeNoMethod } from '../sb-serialize-preview/sb-serialize.model';

const csbReactTemplateFiles = readCSBReactTemplateFiles(reactTemplateDir).catch(e => {
  console.error('Could not read files to use for codesandbox. There is a blocking bug to fix.');
  throw e;
});

@Controller('code')
export class CodeController {
  // constructor() {}

  @Post('export')
  async exportCode(@Body() figmaNode: SceneNodeNoMethod) {
    // console.log('figmaNode:', figmaNode);
    const { data } = await axios.post<CSBResponse>('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
      files: await csbReactTemplateFiles,
    });
    console.log('data:', data);
    return data;
  }
}

async function readCSBReactTemplateFiles(directory: string, base = '', files: Dict<{ content: string }> = {}) {
  for (const fileOrDir of await readdir(directory)) {
    const path = join(directory, fileOrDir);
    if ((await stat(path)).isDirectory()) {
      readCSBReactTemplateFiles(path, `${base}${fileOrDir}/`, files);
    } else {
      let content = await readFile(path, { encoding: 'utf-8' });
      if (fileOrDir.endsWith('.json')) {
        content = JSON.parse(content);
      }
      files[`${base}${fileOrDir}`] = { content };
    }
  }
  return files;
}

// async function test() {
//   console.log('-----------', reactTemplateDir);
//   const files = await csbReactTemplateFiles;
//   console.log(files);
//   console.log('-----------');
// }
// test().catch(handleError);
