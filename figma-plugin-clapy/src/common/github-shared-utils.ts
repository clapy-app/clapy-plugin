import type { GithubSettings, SelectedRepo } from './app-models.js';

// Centralize the logic to update the repository selection, both in redux state and in Figma storage.
export function setRepoInSettings(settings: GithubSettings, repo: SelectedRepo | undefined) {
  const prevRepo = settings.repository;
  if (repo !== prevRepo) {
    settings.mergeToBranch = undefined;
    settings.codegenBranch = undefined;
  }
  settings.repository = repo;
  return settings;
}
