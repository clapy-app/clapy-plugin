import type { UserProfileState, ValueOf } from '../../../common/app-models.js';
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

export async function setUserSetting<Name extends keyof UserSettings = keyof UserSettings>(
  name: Name,
  value: UserSettings[Name],
) {
  return setUserSettingAllowCallback(name, value);
}

export async function setUserSubSetting<Name extends keyof UserSettings = keyof UserSettings>(
  name: Name,
  value: UserSettings[Name],
  parentKey: string,
) {
  return setUserSettingAllowCallback(name, value, parentKey);
}

type UserSettingsRelaxed = Record<keyof UserSettings, ValueOf<UserSettings>>;

// Callbacks can't be passed from plugin front to back as argument (not serializable).
// For specific setters, you should create your own route that calls setUserSettingAllowCallback.
// The function can be shared with the front by putting it in the shared folder src/common/
// and importing it both in the plugin front and plugin back (the function will be included in both bundles).
async function setUserSettingAllowCallback<Name extends keyof UserSettings = keyof UserSettings>(
  nameOrCallback: Name | ((settings: Partial<UserSettings>) => void),
  value: UserSettings[Name],
  parentKey?: string,
) {
  let settings: Partial<UserSettings> | undefined = await figma.clientStorage.getAsync('userSettings');
  if (!settings) {
    settings = {};
  }

  if (typeof nameOrCallback === 'function') {
    nameOrCallback(settings);
  } else if (parentKey) {
    const parentKeyTyped = parentKey as keyof UserSettings;
    if (!settings[parentKeyTyped]) {
      (settings as UserSettingsRelaxed)[parentKeyTyped] = {};
    }
    ((settings as UserSettingsRelaxed)[parentKeyTyped] as Dict)[nameOrCallback] = value || undefined;
  } else {
    (settings as UserSettingsRelaxed)[nameOrCallback as keyof UserSettings] = value || undefined;
  }

  await figma.clientStorage.setAsync('userSettings', settings);
}
