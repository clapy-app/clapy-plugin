import type { GithubSettings } from '../../../common/app-models.js';

export async function getGithubSettings() {
  return figma.clientStorage.getAsync('githubSettings') as Promise<GithubSettings | undefined>;
}

export async function addRepoToSettings(repo: string | null) {
  let settings: GithubSettings | undefined = await figma.clientStorage.getAsync('githubSettings');
  if (!settings) {
    settings = {};
  }
  settings.repository = repo || undefined;
  await figma.clientStorage.setAsync('githubSettings', settings);
}
