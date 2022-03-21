import { Body, Controller, Post } from '@nestjs/common';
import axios from 'axios';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

import { reactTemplateDir } from '../../root';
import { Dict, SceneNodeNoMethod } from '../sb-serialize-preview/sb-serialize.model';

const csbReactTemplateFiles = readCSBReactTemplateFiles(reactTemplateDir).catch(e => {
  console.error('Could not read files to use for codesandbox. There is a blocking bug to fix.');
  throw e;
});

@Controller('code')
// @PublicRoute()
export class CodeController {
  // constructor() {}

  @Post('export')
  async exportCode(/* @Query('sbUrl') sbUrl: string, */ @Body() figmaNode: SceneNodeNoMethod) {
    // console.log('Foo');
    // console.log('figmaNode:', figmaNode);
    const { data } = await axios.post('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
      files: await csbReactTemplateFiles,
      // {
      //   'package.json': {
      //     content: {
      //       dependencies: {
      //         react: 'latest',
      //         'react-dom': 'latest',
      //       },
      //     },
      //   },
      //   'index.js': {
      //     content: code,
      //   },
      //   'index.html': {
      //     content: html,
      //   },
      // },
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
      // if (fileOrDir === 'tsconfig.json') continue;
      let content = await readFile(path, { encoding: 'utf-8' });
      if (fileOrDir.endsWith('.json')) {
        content = JSON.parse(content);
      }
      files[`${base}${fileOrDir}`] = { content };
      // files.push([`${base}${fileOrDir}`, await readFile(path, { encoding: 'utf-8' })]);
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
