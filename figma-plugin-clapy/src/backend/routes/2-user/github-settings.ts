import { setRepoInSettings } from '../../../common/github-shared-utils.js';
import type { GithubSettings, SelectedRepo } from '../../../common/sb-serialize.model.js';

export async function getGithubSettings() {
  return figma.clientStorage.getAsync('githubSettings') as Promise<GithubSettings | undefined>;
}

export async function addRepoToSettings(repo: SelectedRepo | undefined) {
  let settings: GithubSettings | undefined = await figma.clientStorage.getAsync('githubSettings');
  if (!settings) {
    settings = {};
  }
  settings = setRepoInSettings(settings, repo);
  await figma.clientStorage.setAsync('githubSettings', settings);
}

export async function addBranchToSettings(branch: string | undefined) {
  let settings: GithubSettings | undefined = await figma.clientStorage.getAsync('githubSettings');
  if (!settings) {
    settings = {};
  }
  settings.mergeToBranch = branch;
  await figma.clientStorage.setAsync('githubSettings', settings);
}
