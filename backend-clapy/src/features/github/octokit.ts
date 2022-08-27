import { Octokit } from '@octokit/rest';
import type { RequestError } from '@octokit/types';

export type MyGithubError = (RequestError | Error) & {
  isGithub: true;
};

export function getOctokit(githubAccessToken: string) {
  const octo = new Octokit({
    auth: githubAccessToken,
    // https://docs.github.com/en/rest/overview/resources-in-the-rest-api#user-agent-required
    userAgent: 'Clapy',
  });
  octo.hook.error('request', async (error, options) => {
    (error as MyGithubError).isGithub = true;
    throw error;
  });
  return octo;
}
