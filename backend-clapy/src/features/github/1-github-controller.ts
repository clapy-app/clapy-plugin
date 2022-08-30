import { Body, Controller, Post, Req } from '@nestjs/common';
import type { RestEndpointMethodTypes } from '@octokit/rest';
import type { RequestPrivate } from '../../typings/express-jwt.js';
import { fetchGithubAccessToken } from './github-api-fetch.js';
import type { GHContext } from './github-service.js';
import { listBranches, fetchUser, listRepos } from './github-service.js';
import { getOctokit } from './octokit.js';

interface GithubCredentials {
  accessToken: string | undefined;
  user: string | undefined;
  hasPermission: boolean;
}

interface TokenPayload {
  githubAccessToken: string;
}

interface ListBranchesReq extends TokenPayload {
  owner: string;
  repo: string;
}

interface ListReposResp {
  githubAccessToken: string;
  repositories: RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'];
}

@Controller('github')
export class GithubController {
  constructor() {}

  @Post('token')
  async fetchGithubCredentials(@Req() req: RequestPrivate) {
    const auth0UserId = req.auth.sub;
    const accessToken = await fetchGithubAccessToken(auth0UserId);
    if (!accessToken) {
      const resp: GithubCredentials = { accessToken: undefined, user: undefined, hasPermission: false };
      return resp;
    }
    const context: GHContext = {
      accessToken,
      auth0UserId: auth0UserId,
      octokit: getOctokit(accessToken),
    };
    const { headers, data } = await fetchUser(context);
    const hasPermission = !!headers['x-oauth-scopes']
      ?.split(',')
      .map(scope => scope.trim())
      .includes('repo');
    const resp: GithubCredentials = { accessToken, user: data.login, hasPermission };
    return resp;
  }

  @Post('list-repos')
  async listRepos(@Req() req: RequestPrivate, @Body() body: TokenPayload) {
    const auth0UserId = req.auth.sub;
    let { githubAccessToken: accessToken } = body;
    const octokit = getOctokit(accessToken);
    const context: GHContext = { accessToken, auth0UserId, octokit };

    return listRepos(context);

    // const files: CodeDict = {
    //   'codegen/foo.ts': "console.log('Hello world!');\n",
    // };
    //
    // const { data } = await listBranches(context);
    // const data = await getCommit(context);
    // const { data } = await createBranch(context, 'gencode');
    // const data = await commitChanges(context, files, 'Auto-commit powered by Clapy');
    // console.log(data);
    // return data;
  }

  @Post('list-branches')
  async listBranches(@Req() req: RequestPrivate, @Body() body: ListBranchesReq) {
    const auth0UserId = req.auth.sub;
    let { githubAccessToken: accessToken, owner, repo } = body;
    if (!owner) throw new Error('Missing `owner` in body, cannot list branches.');
    if (!repo) throw new Error('Missing `repo` in body, cannot list branches.');
    const octokit = getOctokit(accessToken);
    const context: GHContext = { accessToken, auth0UserId, octokit, owner, repo };

    return listBranches(context);

    // const files: CodeDict = {
    //   'codegen/foo.ts': "console.log('Hello world!');\n",
    // };
    //
    // const { data } = await listBranches(context);
    // const data = await getCommit(context);
    // const { data } = await createBranch(context, 'gencode');
    // const data = await commitChanges(context, files, 'Auto-commit powered by Clapy');
    // console.log(data);
    // return data;
  }

  //   @Post('search-repos')
  //   async searchRepos(@Req() req: RequestPrivate, @Body() body: TokenPayload) {
  //     const auth0UserId = req.auth.sub;
  //     let { githubAccessToken: accessToken } = body;
  //     const octokit = getOctokit(accessToken);
  //     const context: GHContext = { accessToken, auth0UserId, octokit };
  //
  //     return searchRepos(context);
  //   }
}
