import { Body, Controller, Get, Headers, Inject, Post, Req } from '@nestjs/common';

import { wait } from '../common/general-utils.js';
import { flags } from '../env-and-config/app-config.js';
import { env } from '../env-and-config/env.js';
import { UserService } from '../features/user/user.service.js';
import type { RequestPrivate } from '../typings/express-jwt.js';
import { HttpService } from '@nestjs/axios';
import type { Dict } from '../features/sb-serialize-preview/sb-serialize.model.js';
import { validateJwtGetDecoded } from './auth.guard.js';
import { linkUsers } from '../features/user/auth0-management-api.js';

@Controller()
export class LoginPrivateController {
  constructor(
    @Inject(HttpService) private httpService: HttpService,
    @Inject(UserService) private userService: UserService,
  ) {}

  @Get('check-session')
  async checkSession(@Req() req: RequestPrivate) {
    const user = req.auth;

    if (env.isDev && flags.simulateColdStart) {
      await wait(3000);
    }

    const subscriptionData = await this.userService.getUserSubscriptionData(user);

    return { ok: true, ...subscriptionData };
  }

  @Post('proxy-link-github')
  async proxyLinkGithub(@Req() req: RequestPrivate, @Body() body: any, @Headers() headers: Dict<string>) {
    const user = req.auth;
    const primaryUserId = user.sub;
    const secondaryUser = await validateJwtGetDecoded(body.link_with);
    const secondaryUserId = secondaryUser.sub;
    const secondaryAccountProvider = 'github';
    if (primaryUserId !== secondaryUserId) {
      await linkUsers(primaryUserId, secondaryUserId, secondaryAccountProvider);
    }
  }
}
