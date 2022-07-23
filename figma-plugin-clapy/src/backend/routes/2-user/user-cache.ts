import type { UserMetadata, UserProfileState } from '../../../common/app-models.js';

export async function getUserState() {
  try {
    const userState = await figma.clientStorage.getAsync('userState');
    const userState2: UserProfileState = userState ? JSON.parse(userState) : undefined;
    return userState2;
  } catch (err) {
    return undefined;
  }
}

export async function setUserMetadata(userMetadata: UserMetadata) {
  const userState2 = JSON.stringify(userMetadata);
  return figma.clientStorage.setAsync('userState', userState2);
}

export async function setUserMetaUsage(/* userMetaUsage: UserMetaUsage */) {
  const userState: UserProfileState = true;
  // The below code would make a full update of the cache instead of just storing true.
  // const userState: UserProfile = (await getUserState()) || {};
  // userState.userMetaUsage = userMetaUsage;
  const userState2 = JSON.stringify(userState);
  return figma.clientStorage.setAsync('userState', userState2);
}
