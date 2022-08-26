import { Body, Controller, Post, Req } from '@nestjs/common';
import type { RestEndpointMethodTypes } from '@octokit/rest';
import type { RequestPrivate } from '../../typings/express-jwt.js';
import type { CodeDict } from '../export-code/code.model.js';
import { ensureAccessTokenDefined } from './github-api-fetch.js';
import type { GHContext } from './github-service.js';
import { commitChanges } from './github-service.js';
import { getOctokit } from './octokit.js';

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

  @Post('list-repos')
  async listRepos(@Body() body: ListReposReq, @Req() req: RequestPrivate) {
    const userId = req.auth.sub;
    let { githubAccessToken } = body;
    githubAccessToken = await ensureAccessTokenDefined(userId, githubAccessToken);
    const context: GHContext = {
      accessToken: githubAccessToken,
      auth0UserId: userId,
      octokit: getOctokit(githubAccessToken),
    };

    const files: CodeDict = {
      'codegen/foo.ts': "console.log('Hello world!');\n",
    };

    // const { data, headers } = await listRepos(context);
    // const { data } = await listBranches(context);
    // const data = await getCommit(context);
    // const { data } = await createBranch(context, 'gencode');
    const data = await commitChanges(context, files, 'Auto-commit powered by Clapy');
    console.log(data);

    // console.log(
    //   'scopes:',
    //   headers['x-oauth-scopes'],
    //   '- scopes accepted:',
    //   `\`${headers['x-accepted-oauth-scopes']}\``,
    // );
    // console.log(data.map(({ name }) => ({ name })));

    // githubAccessToken = context.octokit.auth

    // const repositories = data;
    // const res: ListReposResp = { githubAccessToken, repositories };
    // return res;
  }
}
