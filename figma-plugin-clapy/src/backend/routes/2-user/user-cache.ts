import type { UserProfileState } from '../../../common/app-models.js';

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
