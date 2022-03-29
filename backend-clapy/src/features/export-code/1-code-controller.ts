import { Body, Controller, Post } from '@nestjs/common';

import { SceneNodeNoMethod } from '../sb-serialize-preview/sb-serialize.model';
import { exportCode } from './2-create-ts-compiler';

@Controller('code')
export class CodeController {
  // constructor() {}

  @Post('export')
  async exportCode(@Body() figmaNode: SceneNodeNoMethod) {
    return exportCode(figmaNode);
    // console.log('figmaNode:', JSON.stringify(figmaNode));
    // TODO prepare the code I'm supposed to generate.
    //
    // const files = await readCSBReactTemplateFiles();
    // if (env.isDev) {
    //   console.log(files);
    // }
    // const data = await uploadToCSB(files);
    //
    //
    // const { data } = await axios.post<CSBResponse>('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
    //   files,
    // });
    // if (env.isDev && data) {
    //   console.log(`Preview: https://${data.sandbox_id}.csb.app`);
    //   console.log(`Edit: https://codesandbox.io/s/${data.sandbox_id}`);
    // }
    // return data;
  }
}
