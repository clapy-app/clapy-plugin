import type { UserProfileState } from '../../../common/app-models.js';
import type { Dict, UserSettings } from '../../../common/sb-serialize.model.js';

export async function getUserMetadata() {
  try {
    const userMetadata = await figma.clientStorage.getAsync('userMetadata');
    const userMetadata2: UserProfileState = userMetadata ? JSON.parse(userMetadata) : undefined;
    return userMetadata2;
  } catch (err) {
    return undefined;
  }
}

export async function setUserMetadata(userMetadata: UserProfileState) {
  const userMetadata2 = JSON.stringify(userMetadata);
  return figma.clientStorage.setAsync('userMetadata', userMetadata2);
}

export async function setUserMetaUsage(/* userMetaUsage: UserMetaUsage */) {
  const userMetadata: UserProfileState = true;
  // The below code would make a full update of the cache instead of just storing true.
  // const userState: UserProfile = (await getUserState()) || {};
  // userState.userMetaUsage = userMetaUsage;
  const userMetadata2 = JSON.stringify(userMetadata);
  return figma.clientStorage.setAsync('userMetadata', userMetadata2);
}

export function getUserSettings(): Promise<UserSettings | undefined> {
  return figma.clientStorage.getAsync('userSettings');
}

export async function setUserSetting<Name extends keyof UserSettings = keyof UserSettings>(settings: UserSettings) {
  return setUserSettingAllowCallback(set => Object.assign(set, settings));
}

export async function setUserSubSetting<Name extends keyof UserSettings = keyof UserSettings>(
  parentKey: Name,
  settings: UserSettings[Name],
) {
  return setUserSettingAllowCallback(set => Object.assign(set[parentKey] || {}, settings));
}

// Callbacks can't be passed from plugin front to back as argument (not serializable).
// For specific setters, you should create your own route that calls setUserSettingAllowCallback.
// The function can be shared with the front by putting it in the shared folder src/common/
// and importing it both in the plugin front and plugin back (the function will be included in both bundles).
async function setUserSettingAllowCallback<Name extends keyof UserSettings = keyof UserSettings>(
  nameOrCallback: Name | Dict | ((settings: UserSettings) => UserSettings | void),
) {
  let settings: UserSettings | undefined = await figma.clientStorage.getAsync('userSettings');
  if (!settings) {
    settings = {};
  }

  if (typeof nameOrCallback === 'function') {
    const settings2 = nameOrCallback(settings);
    if (settings2) {
      settings = settings2;
    }
  }

  await figma.clientStorage.setAsync('userSettings', settings);
}
