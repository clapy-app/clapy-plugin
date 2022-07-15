import { Controller, Get, Query } from '@nestjs/common';

// import { extractStories } from './1-extract-stories.js';
// import { sbSerializePreview } from './2-serialize-preview.js';

@Controller('stories')
// @PublicRoute()
export class SbSerializeController {
  // constructor() {}

  @Get('fetch-list')
  fetchStories(@Query('sbUrl') sbUrl: string) {
    // return extractStories(sbUrl);
    return undefined;
  }

  @Get('serialize')
  serialize(@Query('url') url: string) {
    // return sbSerializePreview(url);
    return undefined;
  }
}
