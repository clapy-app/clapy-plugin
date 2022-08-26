import { Octokit } from '@octokit/rest';

export function getOctokit(githubAccessToken: string) {
  return new Octokit({
    auth: githubAccessToken,
    // https://docs.github.com/en/rest/overview/resources-in-the-rest-api#user-agent-required
    userAgent: 'Clapy',
  });
}
