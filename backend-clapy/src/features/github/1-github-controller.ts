import { Body, Controller, Post, Req } from '@nestjs/common';
import type { RequestPrivate } from '../../typings/express-jwt.js';
import type { GHRepo } from './github-auth.js';
import { listGHRepos } from './github-auth.js';

interface ListReposReq {
  githubAccessToken?: string;
}

interface ListReposResp {
  githubAccessToken: string;
  repositories: GHRepo[];
}

@Controller('github')
export class GithubController {
  constructor() {}
  @Post('list-repos')
  async listRepos(@Body() body: ListReposReq, @Req() req: RequestPrivate) {
    const userId = req.auth.sub;
    let { githubAccessToken } = body;
    console.log('githubAccessToken:');
    console.log(githubAccessToken);
    const { accessToken, data, headers } = await listGHRepos(userId, githubAccessToken);
    console.log(
      'scopes:',
      headers['x-oauth-scopes'],
      '- scopes accepted:',
      `\`${headers['x-accepted-oauth-scopes']}\``,
    );
    console.log(data.map(({ name }) => ({ name })));

    githubAccessToken = accessToken;
    const repositories = data;
    const res: ListReposResp = { githubAccessToken, repositories };
    return res;
  }
}
