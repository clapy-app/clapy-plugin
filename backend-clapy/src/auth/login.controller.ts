import { HttpService } from '@nestjs/axios';
import { Body, Controller, Get, Headers, Post, Query, Render } from '@nestjs/common';
import { map } from 'rxjs';
import { env } from '../environment/env';
import { Dict } from '../features/sb-serialize-preview/sb-serialize.model';
import { generateToken } from '../utils';
import { IsBrowserGet } from './IsBrowserGet.decorator';
import { PublicRoute } from './public-route-annotation';

interface ReadCacheEntry {
  code?: string;
}
interface WriteCacheEntry {
  readToken: string;
}
const inMemoryReadTokenCache: Dict<ReadCacheEntry> = {};
const inMemoryWriteTokenCache: Dict<WriteCacheEntry> = {};

const { auth0Domain, auth0ClientId, baseUrl } = env;
const authEnv = JSON.stringify({ auth0Domain, auth0ClientId, baseUrl });

@Controller()
@PublicRoute()
export class LoginController {

  constructor(private httpService: HttpService) {}

  // Debug
  @Get('debug')
  @Render('debug')
  @IsBrowserGet()
  debug() {
    return { inMemoryReadTokenCache: JSON.stringify(inMemoryReadTokenCache), inMemoryWriteTokenCache: JSON.stringify(inMemoryWriteTokenCache) };
  }

  @Get('generate-tokens')
  async generateTokens() {
    const readToken = await generateToken();
    const writeToken = await generateToken();
    inMemoryReadTokenCache[readToken] = {};
    inMemoryWriteTokenCache[writeToken] = { readToken };
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
  loginCallback(@Query('code') code: string, @Query('state') writeToken: string) {
    const writeTokenEntry = inMemoryWriteTokenCache[writeToken];
    if (!writeTokenEntry) {
      throw new Error(`Write token invalid or already consumed`);
    }
    const readToken = writeTokenEntry?.readToken;
    const readTokenEntry = readToken ? inMemoryReadTokenCache[readToken] : undefined;
    if (!readTokenEntry) {
      throw new Error(`The read token linked to the write token is not found.`);
    }
    if (readToken) {
      inMemoryReadTokenCache[readToken].code = code;
    }
    if (writeTokenEntry) {
      delete inMemoryWriteTokenCache[writeToken];
    }
    return { writeToken, authEnv };
  }

  @Get('logged-out')
  @Render('logged-out')
  @IsBrowserGet()
  loggedOut() {
    return {};
  }

  @Get('read-code')
  readCode(@Headers('read_token') readToken: string) {
    const entry = inMemoryReadTokenCache[readToken];
    return { code: entry?.code };
  }

  @Get('delete-read-token')
  deleteReadToken(@Headers('read_token') readToken: string) {
    // System to improve. If the deletion fails (e.g. network), it remains in memory forever.
    // At least, we should have an expiration date or a better transaction system with the front.
    if (inMemoryReadTokenCache[readToken]) {
      delete inMemoryReadTokenCache[readToken];
      return { deleted: true };
    }
    return { deleted: false };
  }

  @Post('proxy-get-token')
  proxyToken(@Body() body: any, @Headers('read_token') readToken: string) {
    if (!readToken) throw new Error(`No read_token in query parameters.`);
    if (!inMemoryReadTokenCache[readToken]) throw new Error(`Invalid read_token in query parameters.`);

    const url = `https://${auth0Domain}/oauth/token`;
    return this.httpService.post(url, body).pipe(
      map(response => response.data),
    );
  }

  @Post('proxy-refresh-token')
  proxyRefreshToken(@Body() body: any) {
    const url = `https://${auth0Domain}/oauth/token`;
    return this.httpService.post(url, body).pipe(
      map(response => response.data),
    );
  }
}