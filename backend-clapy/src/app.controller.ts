import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';
import { IsBrowserGet } from './auth/IsBrowserGet.decorator';
import { PublicRoute } from './auth/public-route-annotation';

@PublicRoute()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @IsBrowserGet()
  @Render('index')
  root() {
    return { message: 'Hello world!' };
  }

}
