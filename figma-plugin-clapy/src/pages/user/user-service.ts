import type { Dispatch } from '@reduxjs/toolkit';

import { apiGet, apiPost } from '../../common/http.utils';
import { dispatchOther, readSelectorOnce } from '../../core/redux/redux.utils';
import { clearMetadata, selectUserMetadata, setMetadata, setMetaProfile, setMetaUsage } from './user-slice';

export interface UserMetadata {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  jobRole?: string;
  techTeamSize?: string;
  usage?: UserMetaUsage;
}

export interface UserMetaUsage {
  components?: boolean;
  designSystem?: boolean;
  landingPages?: boolean;
  other?: boolean;
  otherDetail?: string;
}

export async function findUserMetadata() {
  let metadata = readSelectorOnce(selectUserMetadata);
  if (!metadata) {
    metadata = (await apiGet<UserMetadata>('user', { _readCachedTokenNoFetch: true })).data;
    dispatchOther(setMetadata(metadata));
  }
  return metadata;
}

export async function updateUserMetadata(metadata: UserMetadata, dispatch: Dispatch) {
  metadata = { ...metadata };
  const res = (await apiPost('user/update-profile', metadata)).data;
  dispatch(setMetaProfile(metadata));
  return res;
}

export async function updateUserMetaUsage(metaUsage: UserMetaUsage, dispatch: Dispatch) {
  metaUsage = { ...metaUsage };
  if (!metaUsage.other && metaUsage.otherDetail) {
    delete metaUsage.otherDetail;
  }
  const res = (await apiPost('user/update-usage', metaUsage)).data;
  dispatch(setMetaUsage(metaUsage));
  return res;
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
