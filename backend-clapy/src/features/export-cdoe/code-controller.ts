import { Body, Controller, Post } from '@nestjs/common';

import { SceneNodeNoMethod } from '../sb-serialize-preview/sb-serialize.model';

@Controller('code')
// @PublicRoute()
export class CodeController {
  // constructor() {}

  @Post('export')
  exportCode(/* @Query('sbUrl') sbUrl: string, */ @Body() figmaNode: SceneNodeNoMethod) {
    console.log('Foo');
    console.log('figmaNode:', figmaNode);
  }
}
