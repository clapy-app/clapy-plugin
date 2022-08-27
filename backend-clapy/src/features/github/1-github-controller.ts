import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { RestEndpointMethodTypes } from '@octokit/rest';
import type { RequestPrivate } from '../../typings/express-jwt.js';
import type { CodeDict } from '../export-code/code.model.js';
import { ensureAccessTokenDefined, fetchGithubAccessToken } from './github-api-fetch.js';
import type { GHContext } from './github-service.js';
import { fetchUser, listRepos } from './github-service.js';
import { getOctokit } from './octokit.js';

interface FetchGithubCredentialsResp {
  accessToken: string | undefined;
  hasPermission: boolean;
}

interface ListReposReq {
  githubAccessToken?: string;
}

interface ListReposResp {
  githubAccessToken: string;
  repositories: RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'];
}

@Controller('github')
export class GithubController {
  constructor() {}

  @Get('gh-token')
  async fetchGithubCredentials(@Req() req: RequestPrivate) {
    const userId = req.auth.sub;
    const accessToken = await fetchGithubAccessToken(userId);
    if (!accessToken) {
      const resp: FetchGithubCredentialsResp = { accessToken: undefined, hasPermission: false };
      return resp;
    }
    const context: GHContext = {
      accessToken,
      auth0UserId: userId,
      octokit: getOctokit(accessToken),
    };
    const { headers, data } = await fetchUser(context);
    console.log(`scope: '${headers['x-oauth-scopes']}'`);
    const hasPermission = !!headers['x-oauth-scopes']
      ?.split(',')
      .map(scope => scope.trim())
      .includes('repo');
    const resp: FetchGithubCredentialsResp = { accessToken, hasPermission };
    return resp;
  }

  @Post('list-repos')
  async listRepos(@Body() body: ListReposReq, @Req() req: RequestPrivate) {
    const auth0UserId = req.auth.sub;
    let { githubAccessToken: accessToken } = body;
    accessToken = await ensureAccessTokenDefined(auth0UserId, accessToken);
    const octokit = getOctokit(accessToken);
    const context: GHContext = { accessToken, auth0UserId, octokit };

    const files: CodeDict = {
      'codegen/foo.ts': "console.log('Hello world!');\n",
    };

    const { data, headers } = await listRepos(context);
    // const { data } = await listBranches(context);
    // const data = await getCommit(context);
    // const { data } = await createBranch(context, 'gencode');
    // const data = await commitChanges(context, files, 'Auto-commit powered by Clapy');
    // console.log(data);

    console.log(
      'scopes:',
      headers['x-oauth-scopes'],
      '- scopes accepted:',
      `\`${headers['x-accepted-oauth-scopes']}\``,
    );
    // console.log(data.map(({ name }) => ({ name })));

    // githubAccessToken = context.octokit.auth

    // const repositories = data;
    // const res: ListReposResp = { githubAccessToken, repositories };
    // return res;
  }
}
