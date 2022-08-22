import type { Dispatch } from '@reduxjs/toolkit';
import equal from 'fast-deep-equal';

import type { UserMetadata, UserMetaUsage, UserProfileState } from '../../common/app-models.js';
import { fetchPlugin } from '../../common/plugin-utils.js';
import { dispatchOther, readSelectorOnce } from '../../core/redux/redux.utils';
import { apiGet, apiPost } from '../../front-utils/http.utils.js';
import { clearMetadata, selectUserProfileState, setMetadata, setMetaProfile, setMetaUsage } from './user-slice';

export async function dispatchLocalUserMetadata(signedInState: boolean) {
  let metadata: UserProfileState = readSelectorOnce(selectUserProfileState);
  if (metadata) return metadata;
  const userProfileState = await fetchPlugin('getUserMetadata');
  if (signedInState && !userProfileState) {
    await fetchUserMetadata();
  } else {
    dispatchOther(setMetadata(userProfileState));
  }
}

export async function fetchUserMetadata() {
  const metadata = (await apiGet<UserMetadata>('user', { _readCachedTokenNoFetch: true })).data;
  const localMetadata: UserProfileState = readSelectorOnce(selectUserProfileState);
  if (!equal(metadata, localMetadata)) {
    dispatchOther(setMetadata(metadata));
    await saveUserMetadataInCache(metadata);
  }
}

export async function updateUserMetadata(metadata: UserMetadata, dispatch: Dispatch) {
  metadata = { ...metadata };
  await apiPost('user/update-profile', metadata);
  dispatch(setMetaProfile(metadata));
  await saveUserMetadataInCache(metadata);
}

async function saveUserMetadataInCache(metadata: UserMetadata) {
  const metaToSave = hasMissingMetaProfile(metadata) || hasMissingMetaUsage(metadata.usage) ? metadata : true;
  await fetchPlugin('setUserMetadata', metaToSave);
}

export async function updateUserMetaUsage(metaUsage: UserMetaUsage, dispatch: Dispatch) {
  metaUsage = { ...metaUsage };
  if (!metaUsage.other && metaUsage.otherDetail) {
    delete metaUsage.otherDetail;
  }
  await apiPost('user/update-usage', metaUsage);
  dispatch(setMetaUsage(metaUsage));
  await fetchPlugin('setUserMetaUsage' /* , metaUsage */);
}

export function clearLocalUserMetadata() {
  dispatchOther(clearMetadata());
}

// Ensure this method is synced with the backend equivalent: backend-clapy/src/features/user/user.service.ts
export function hasMissingMetaProfile(
  { firstName, lastName, companyName, jobRole, phone, techTeamSize } = {} as UserMetadata,
) {
  return !firstName || !lastName || (!phone && !companyName) || !jobRole || !techTeamSize;
}

// Ensure this method is synced with the backend equivalent: backend-clapy/src/features/user/user.service.ts
export function hasMissingMetaUsage(userMetaUsage: UserMetaUsage | undefined) {
  const { components, designSystem, landingPages, other, otherDetail } = userMetaUsage || {};
  return !components && !designSystem && !landingPages && !(other && otherDetail);
}
