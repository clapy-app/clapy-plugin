import type { Dispatch } from '@reduxjs/toolkit';
import equal from 'fast-deep-equal';

import type { UserMetadata, UserMetaUsage } from '../../common/app-models.js';
import { apiGet, apiPost } from '../../common/http.utils';
import { fetchPlugin } from '../../common/plugin-utils.js';
import { dispatchOther, readSelectorOnce } from '../../core/redux/redux.utils';
import { clearMetadata, selectUserMetadata, setMetadata, setMetaProfile, setMetaUsage } from './user-slice';

export async function dispatchLocalUserMetadata() {
  let metadata: UserMetadata | undefined = readSelectorOnce(selectUserMetadata);
  if (metadata) return metadata;
  const userProfileState = await fetchPlugin('getUserState');
  metadata = userProfileState === true ? {} : userProfileState ? userProfileState : undefined;
  dispatchOther(setMetadata(metadata));
}

export async function fetchUserMetadata() {
  const metadata = (await apiGet<UserMetadata>('user', { _readCachedTokenNoFetch: true })).data;
  const localMetadata: UserMetadata | undefined = readSelectorOnce(selectUserMetadata);
  if (!equal(metadata, localMetadata)) {
    dispatchOther(setMetadata(metadata));
    await fetchPlugin('setUserMetadata', metadata);
  }
}

export async function updateUserMetadata(metadata: UserMetadata, dispatch: Dispatch) {
  metadata = { ...metadata };
  await apiPost('user/update-profile', metadata);
  dispatch(setMetaProfile(metadata));
  await fetchPlugin('setUserMetadata', metadata);
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
  { firstName, lastName, companyName, jobRole, techTeamSize } = {} as UserMetadata,
) {
  return !firstName || !lastName || !companyName || !jobRole || !techTeamSize;
}

// Ensure this method is synced with the backend equivalent: backend-clapy/src/features/user/user.service.ts
export function hasMissingMetaUsage(userMetaUsage: UserMetaUsage | undefined) {
  const { components, designSystem, landingPages, other, otherDetail } = userMetaUsage || {};
  return !components && !designSystem && !landingPages && !(other && otherDetail);
}
