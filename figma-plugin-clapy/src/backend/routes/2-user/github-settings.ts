import { setRepoInSettings } from '../../../common/github-shared-utils.js';
import type { GithubSettings, SelectedRepo } from '../../../common/sb-serialize.model.js';

export async function getGithubSettings() {
  return figma.clientStorage.getAsync('githubSettings') as Promise<GithubSettings | undefined>;
}

export async function addRepoToSettings(repo: SelectedRepo | undefined) {
  await updateSettings(settings => (settings = setRepoInSettings(settings, repo)));
}

export async function addTargetBranchToSettings(branch: string | undefined) {
  await updateSettings(settings => (settings.mergeToBranch = branch));
}

export async function addCodeGenBranchToSettings(branch: string | undefined) {
  await updateSettings(settings => (settings.codegenBranch = branch));
}

async function updateSettings(updateSettingsCallback: (settings: GithubSettings) => void) {
  let settings: GithubSettings | undefined = await figma.clientStorage.getAsync('githubSettings');
  if (!settings) {
    settings = {};
  }
  updateSettingsCallback(settings);
  await figma.clientStorage.setAsync('githubSettings', settings);
}
