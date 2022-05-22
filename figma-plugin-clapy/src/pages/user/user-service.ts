import { Dispatch } from '@reduxjs/toolkit';

import { apiGet, apiPost } from '../../common/http.utils';
import { dispatchOther, readSelectorOnce } from '../../core/redux/redux.utils';
import { clearMetadata, selectUserMetadata, setMetadata, setMetaUsage } from './user-slice';

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
  dispatch(setMetadata(metadata));
  return res;
}

export async function updateUserMetaUsage(metaUsage: UserMetaUsage, dispatch: Dispatch) {
  metaUsage = { ...metaUsage };
  const res = (await apiPost('user/update-usage', metaUsage)).data;
  dispatch(setMetaUsage(metaUsage));
  return res;
}

export function clearLocalUserMetadata() {
  dispatchOther(clearMetadata());
}

export function hasMissingMetaProfile(
  { firstName, lastName, companyName, jobRole, techTeamSize } = {} as UserMetadata,
) {
  return !firstName || !lastName || !companyName || !jobRole || !techTeamSize;
}

export function hasMissingMetaUsage(userMetaUsage: UserMetaUsage | undefined) {
  const { components, designSystem, landingPages, other } = userMetaUsage || {};
  return !components && !designSystem && !landingPages && !other;
}
