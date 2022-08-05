import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { UserMetadata, UserMetaUsage, UserProfileState } from '../../common/app-models.js';
import type { RootState } from '../../core/redux/store';
import { env } from '../../environment/env.js';
import { hasMissingMetaProfile, hasMissingMetaUsage } from './user-service.js';

export interface UserState {
  userMetadata?: UserProfileState;
}

const initialState: UserState = {};

// To add to src/core/redux/store.ts
export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setMetadata: (state, { payload }: PayloadAction<UserProfileState>) => {
      if (typeof payload === 'object' && typeof state.userMetadata === 'object') {
        Object.assign(state.userMetadata, payload);
      } else {
        state.userMetadata = payload || {};
      }
    },
    setMetaProfile: (state, { payload }: PayloadAction<UserMetadata>) => {
      const { firstName, lastName, phone, jobRole, techTeamSize } = payload;
      const meta = !state.userMetadata || state.userMetadata === true ? {} : state.userMetadata;
      state.userMetadata = { ...meta, firstName, lastName, phone, jobRole, techTeamSize };
    },
    setMetaUsage: (state, { payload }: PayloadAction<UserMetaUsage>) => {
      if (!state.userMetadata || state.userMetadata === true) state.userMetadata = {};
      state.userMetadata.usage = payload;
    },
    clearMetadata: state => {
      state.userMetadata = undefined;
    },
    setStripeData: (state, { payload }: PayloadAction<UserMetadata>) => {
      // Tmp to allow the UI to be displayed if userMetadata is true
      if (state.userMetadata && state.userMetadata !== true) {
        state.userMetadata.quotas = payload.quotas;
        state.userMetadata.quotasMax = payload.quotasMax;

        state.userMetadata.isLicenceExpired = payload.isLicenceExpired;
      }
      // (state.userMetadata as UserMetadata).quotas = payload.quotas;
      // (state.userMetadata as UserMetadata).isLicenceExpired = payload.isLicenceExpired;
    },
  },
});

export const { setMetadata, setMetaProfile, setMetaUsage, clearMetadata, setStripeData } = userSlice.actions;

export const selectUserQuota = (state: RootState) => (state.user.userMetadata as UserMetadata)?.quotas!;
export const selectUserMaxQuota = (state: RootState) => (state.user.userMetadata as UserMetadata)?.quotasMax!;
export const selectIsUserLimited = (state: RootState) => (state.user.userMetadata as UserMetadata)?.limitedUser!;
export const selectIsUserMaxQuotaReached = (state: RootState) => {
  const { isLicenceExpired, quotas, quotasMax } = state.user.userMetadata as UserMetadata;
  const isMaxQuotaReached = quotas! >= quotasMax!;
  return isMaxQuotaReached && isLicenceExpired;
};
export const selectIsFreeUser = (state: RootState) => {
  if (env.isDev) return false;
  const { isLicenceExpired } = state.user.userMetadata as UserMetadata;
  return isLicenceExpired!;
};

export const selectUserProfileState = (state: RootState) => state.user.userMetadata;
export const selectHasMissingMetaProfile = (state: RootState) =>
  state.user.userMetadata !== true && hasMissingMetaProfile(state.user.userMetadata);
export const selectHasMissingMetaUsage = (state: RootState) =>
  state.user.userMetadata !== true && hasMissingMetaUsage(state.user.userMetadata?.usage);
/**
 * Called in FillUserProfile or FillUserProfileStep2. Assumes it's not `true`, which should have been
 * filtered earlier in Layout.tsx with the above selectors. And assumes it's not undefined, which
 * should have been filtered by the FillUserProfile wrapper.
 */
export const selectUserMetadata = (state: RootState) => state.user.userMetadata as UserMetadata;
export const selectUserMetaUsage = (state: RootState) => (state.user.userMetadata as UserMetadata)?.usage;
