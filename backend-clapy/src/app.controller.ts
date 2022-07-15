import { Controller, Get, Inject, Render } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { AppService } from './app.service.js';
import { IsBrowserGet } from './auth/IsBrowserGet.decorator.js';
import { LoginTokensEntity } from './auth/login-tokens.entity.js';
import { PublicRoute } from './auth/public-route-annotation.js';

@PublicRoute()
@Controller()
export class AppController {
  constructor(
    @Inject(AppService) private readonly appService: AppService,
    @InjectRepository(LoginTokensEntity) private usersRepository: Repository<LoginTokensEntity>,
  ) {}

  @Get()
  @IsBrowserGet()
  @Render('index')
  root() {
    return { message: 'Hello world!' };
  }

  @Get('isdbalive')
  @IsBrowserGet()
  async checkDb() {
    const tokens = new LoginTokensEntity();
    tokens.readToken = '';
    tokens.writeToken = '';
    await this.usersRepository.save(tokens);
    await this.usersRepository.remove(tokens);
    return { message: 'The database works.' };
  }
}
