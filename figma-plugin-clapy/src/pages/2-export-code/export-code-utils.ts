import { useEffect } from 'react';
import type { ValueOf } from '../../common/app-models.js';
import { fetchPlugin } from '../../common/plugin-utils.js';
import type { GithubSettings, UserSettings } from '../../common/sb-serialize.model.js';
import { dispatchOther, readSelectorOnce } from '../../core/redux/redux.utils.js';
import { handleError, toastError } from '../../front-utils/front-utils.js';
import {
  defaultUserSettings,
  endLoadingUserSettings,
  selectUserSettings,
  setUserSettingRedux,
  setUserSettings,
  startLoadingUserSettings,
} from './export-code-slice.js';
import type { UserSettingsKeys } from './FigmaToCodeHome/figmaToCode-model.js';
import { setGitHubSetting } from './github/github-slice.js';

export function downloadFile(blob: Blob, fileName: string) {
  const link = document.createElement('a');
  // create a blobURI pointing to our Blob
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  // some browser needs the anchor to be in the doc
  document.body.append(link);
  link.click();
  link.remove();
  // in case the Blob uses a lot of memory
  setTimeout(() => URL.revokeObjectURL(link.href), 7000);
}

// Load initial user settings

export async function useLoadUserSettings() {
  useEffect(() => {
    (async () => {
      try {
        await loadUserSettingsWithLoading();
      } catch (err) {
        handleError(err);
        toastError(err);
      }
    })();
  }, []);
}

export async function loadUserSettingsWithLoading() {
  try {
    dispatchOther(startLoadingUserSettings());
    const settings = await readUserSettingsWithDefaults();
    return settings;
  } finally {
    dispatchOther(endLoadingUserSettings());
  }
}

export async function readUserSettingsWithDefaults() {
  let settings: UserSettings | undefined = readSelectorOnce(selectUserSettings);
  if (!settings) {
    settings = { ...defaultUserSettings, ...(await fetchPlugin('getUserSettings')) };
    dispatchOther(setUserSettings(settings));
  }
  return settings;
}

// Provides auto-completion and type-checking in the argument, while returning a const type (e.g. 'page' instead of string if the argument is 'page')
export function createSettingName<T extends UserSettingsKeys>(name: T): T {
  return name;
}

export async function setUserSetting<Name extends keyof UserSettings = keyof UserSettings>(
  name: Name,
  value: UserSettings[Name],
  isGithub?: boolean,
) {
  if (!name) {
    handleError(
      new Error('BUG changeSetting input must have the name of the corresponding option as `name` attribute.'),
    );
    return;
  }
  if (isGithub) {
    dispatchOther(setGitHubSetting({ name: name as keyof GithubSettings, value: value as ValueOf<GithubSettings> }));
    await fetchPlugin('setUserSubSetting', name, value, 'githubSettings');
  } else {
    dispatchOther(setUserSettingRedux({ name, value }));
    await fetchPlugin('setUserSetting', name, value);
  }
}
