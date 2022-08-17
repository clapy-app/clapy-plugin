import { Body, Controller, Get, Headers, Inject, Post, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { decode } from 'jsonwebtoken';
import type { Repository } from 'typeorm';

import { AppService } from './app.service.js';
import { IsBrowserGet } from './auth/IsBrowserGet.decorator.js';
import { LoginTokensEntity } from './auth/login-tokens.entity.js';
import { PublicRoute } from './auth/public-route-annotation.js';
import type { AccessTokenDecoded } from './features/user/user.utils.js';

@PublicRoute()
@Controller()
export class AppController {
  constructor(
    @Inject(AppService) private readonly appService: AppService,
    @InjectRepository(LoginTokensEntity) private usersRepository: Repository<LoginTokensEntity>,
  ) {}

  @Get()
  @IsBrowserGet()
  root() {
    return { message: 'Hello from Clapy!' };
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

  @Post('front-monitor')
  async frontReport(@Body() body: any, @Headers('Authorization') authHeader: string, @Req() req: Request) {
    // Extract user data from the header. In public routes, express-jwt is not run so the user is not in the request.
    const accessToken = authHeader?.length >= 8 ? authHeader.slice(7) : authHeader;
    const user = accessToken ? (decode(accessToken) as AccessTokenDecoded) : undefined;
    req.auth = user;

    if (!body) body = {};
    let { message /* , stack */ } = body;
    if (!message) message = 'Unknown error';
    message = `[FRONT REPORT] ${message}`;

    // if (!stack) {
    //   stack = new Error(`[FRONT REPORT] No front stack trace - ${message}`).stack;
    // } else {
    //   stack = `[FRONT REPORT] ${stack}`;
    // }

    throw new Error(message);

    //     const err = new Error(message);
    //     err.stack = stack;
    //
    //     throw err;

    // throw new Error('This is an attempt to log the error in gcloud');
  }
}
