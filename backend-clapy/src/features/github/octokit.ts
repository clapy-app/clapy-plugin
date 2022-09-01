import { Octokit } from '@octokit/rest';
import type { RequestError } from '@octokit/types';
import { retry } from '@octokit/plugin-retry';
import { throttling } from '@octokit/plugin-throttling';
import { env } from '../../env-and-config/env.js';

export type MyGithubError = (RequestError | Error) & {
  isGithub: true;
};

const OctokitWithPlugins = Octokit.plugin(throttling, retry);

export function getOctokit(githubAccessToken: string) {
  const octokit = new OctokitWithPlugins({
    auth: githubAccessToken,
    // https://docs.github.com/en/rest/overview/resources-in-the-rest-api#user-agent-required
    userAgent: 'Clapy',

    throttle: {
      onRateLimit: (retryAfter: any, options: any, octokit: any) => options.request.retryCount < 2,
      onSecondaryRateLimit: (retryAfter: any, options: any, octokit: any) => options.request.retryCount < 2,
    },
  });
  octokit.hook.error('request', async (error, options) => {
    (error as MyGithubError).isGithub = true;
    if (env.isDev) {
      console.error('octokit error:');
      console.error(error);
    }
    throw error;
  });
  // octokit.hook.wrap('request', async (request, options) => {
  //   // add logic before, after, catch errors or replace the request altogether
  //   return request(options);
  // });
  return octokit;
}
