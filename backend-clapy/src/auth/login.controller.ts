import { HttpService } from '@nestjs/axios';
import { Body, Controller, Get, Headers, Inject, Post, Query, Render } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { map } from 'rxjs';
import type { Repository } from 'typeorm';

import { env } from '../env-and-config/env.js';
import { generateToken } from '../utils.js';
import { IsBrowserGet } from './IsBrowserGet.decorator.js';
import { LoginTokensEntity } from './login-tokens.entity.js';
import { PublicRoute } from './public-route-annotation.js';

const { auth0Domain, auth0ClientId, baseUrl } = env;
const authEnv = JSON.stringify({ auth0Domain, auth0ClientId, baseUrl });

@Controller()
@PublicRoute()
export class LoginController {
  constructor(
    @Inject(HttpService) private httpService: HttpService,
    @InjectRepository(LoginTokensEntity) private loginTokensRepo: Repository<LoginTokensEntity>,
  ) {}

  // Debug
  @Get('debug')
  @Render('debug')
  @IsBrowserGet()
  async debug(@Query('from') from: string = 'browser') {
    if (!env.isDev) {
      return {};
    }
    const res = await this.loginTokensRepo.find();
    return {
      tokens: JSON.stringify(res),
      from,
    };
  }

  @Get('generate-tokens')
  async generateTokens() {
    const tokens = new LoginTokensEntity();
    const readToken = await generateToken();
    const writeToken = await generateToken();
    tokens.readToken = readToken;
    tokens.writeToken = writeToken;
    await this.loginTokensRepo.save(tokens);
    return { readToken, writeToken };
  }

  // @Get('login')
  // @Render('login')
  // login() {
  //   return { authEnv };
  // }

  // In callback, use the write token to write the exchange code in 'read' cache and delete the write cache entry

  @Get('login/callback')
  @Render('login-callback')
  @IsBrowserGet()
  async loginCallback(
    @Query('code') code: string | undefined,
    @Query('state') writeToken: string | undefined,
    @Query('from') from: 'browser' | 'desktop' | undefined,
    @Query('error') error: 'access_denied' | undefined,
    @Query('error_description') errorDescription: string | undefined,
  ) {
    if (!writeToken) throw new Error(`No state in query parameters.`);
    const writeTokenEntity = await this.loginTokensRepo.findOne({ where: { writeToken } });
    if (!writeTokenEntity) {
      throw new Error(`Write token invalid or already consumed`);
    }
    if (code) {
      writeTokenEntity.code = code;
    } else {
      writeTokenEntity.code = `error|${error}|${errorDescription}`;
    }
    writeTokenEntity.writeToken = undefined;
    await this.loginTokensRepo.save(writeTokenEntity);

    return { authEnv, from };
  }

  @Get('logged-out')
  @Render('logged-out')
  @IsBrowserGet()
  loggedOut(@Query('from') from: string = 'browser', @Query('reauth') reauth: string) {
    const mustReauth = reauth != null;
    return { from, mustReauth };
  }

  @Get('read-code')
  async readCode(@Headers('read_token') readToken: string) {
    if (!readToken) throw new Error(`No read_token in query parameters.`);
    const readTokenEntity = await this.loginTokensRepo.findOne({ where: { readToken } });
    return { code: readTokenEntity?.code };
  }

  @Get('delete-read-token')
  async deleteReadToken(@Headers('read_token') readToken: string) {
    // System to improve. If the deletion fails (e.g. network), it remains in memory forever.
    // At least, we should have an expiration date or a better transaction system with the front.
    if (!readToken) throw new Error(`No read_token in query parameters.`);
    const res = await this.loginTokensRepo.delete({ readToken });
    return { deleted: !!res.affected };
  }

  @Post('proxy-get-token')
  async proxyToken(@Body() body: any = {}, @Headers('read_token') readToken: string) {
    if (!readToken) throw new Error(`No read_token in query parameters.`);
    const readTokenEntity = await this.loginTokensRepo.findOne({ where: { readToken } });
    if (!readTokenEntity) throw new Error(`Invalid read_token in query parameters.`);

    const url = `https://${auth0Domain}/oauth/token`;
    return this.httpService.post(url, body).pipe(map(response => response.data));
  }

  @Post('proxy-refresh-token')
  proxyRefreshToken(@Body() body: any) {
    const url = `https://${auth0Domain}/oauth/token`;
    return this.httpService.post(url, body).pipe(map(response => response.data));
  }
}
