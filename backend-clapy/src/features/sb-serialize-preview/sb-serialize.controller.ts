import { Controller, Get, Query } from '@nestjs/common';
import { PublicRoute } from '../../auth/public-route-annotation';
import { extractStories } from './1-extract-stories';
import { sbSerializePreview } from './2-serialize-preview';

@Controller('stories')
  @PublicRoute()
export class SbSerializeController {
  // constructor() {}

  @Get('fetch-list')
  fetchStories(@Query('sbUrl') sbUrl: string) {
    return extractStories(sbUrl);
  }

  @Get('serialize')
  serialize(@Query('url') url: string) {
    return sbSerializePreview(url);
  }

}
