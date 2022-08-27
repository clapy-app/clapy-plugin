import type { AxiosError } from 'axios';
import { waitInfinite } from './common/general-utils.js';
import { perfReset, perfTotal } from './common/perf-utils.js';
import { GithubController } from './features/github/1-github-controller.js';
import type { RequestPrivate } from './typings/express-jwt.js';

async function main() {
  perfReset('Starting...');

  // To work on features outside the webservice, and keep live reload.

  if (!process.env.GITHUB_ACCESS_TOKEN) {
    throw new Error(
      'Please add GITHUB_ACCESS_TOKEN to the .env file at the root of the repository before starting this script.',
    );
  }
  const githubAccessToken = process.env.GITHUB_ACCESS_TOKEN;
  await new GithubController().listRepos(
    {
      auth: { sub: 'google-oauth2|105573232794317486965' },
    } as RequestPrivate,
    { githubAccessToken },
  );

  // Send to codesandbox
  // TODO restore. Find the syntax to instantiate the controller with the right dependencies
  // await new CodeController().exportCode(devFigmaConfig, false);

  // await insertTrackings();

  perfTotal();
}

main().catch(err => {
  console.error('Error caught in main2.ts, normally sent to the client.');
  console.error((err as AxiosError)?.response?.data || err);
});

waitInfinite();
