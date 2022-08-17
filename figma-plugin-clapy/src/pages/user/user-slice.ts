import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { UserMetadata, UserMetaUsage, UserProfileState } from '../../common/app-models.js';
import { selectIsStripeDevTeam } from '../../core/auth/auth-slice.js';
import type { RootState } from '../../core/redux/store';
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
      // Tmp to allow the UI to be displayed if userMetadata is true.
      // Should we prefix with the following instead?
      // > if (!state.userMetadata || state.userMetadata === true) state.userMetadata = {};
      if (state.userMetadata && state.userMetadata !== true) {
        state.userMetadata.quotas = payload.quotas;
        state.userMetadata.quotasMax = payload.quotasMax;

        state.userMetadata.isLicenseExpired = payload.isLicenseExpired;
      }
    },
  },
});

export const { setMetadata, setMetaProfile, setMetaUsage, clearMetadata, setStripeData } = userSlice.actions;

export const selectUserQuota = (state: RootState) => (state.user.userMetadata as UserMetadata)?.quotas!;
export const selectUserMaxQuota = (state: RootState) => (state.user.userMetadata as UserMetadata)?.quotasMax!;
// export const selectIsUserLimited = (state: RootState) => (state.user.userMetadata as UserMetadata)?.limitedUser!;
export const selectIsFreeUser = (state: RootState) => {
  const { isLicenseExpired } = state.user.userMetadata as UserMetadata;
  return isLicenseExpired!;
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

export const selectIsUserMaxQuotaReached = createSelector(
  selectIsFreeUser,
  selectUserMetadata,
  selectIsStripeDevTeam,
  (isFreeUser, userMetadata, hasStripeDevTeamRole) => {
    if (hasStripeDevTeamRole) {
      if (!isFreeUser) return false;
      const { isLicenseExpired, quotas, quotasMax } = userMetadata;
      const isMaxQuotaReached = quotas! >= quotasMax!;
      return isMaxQuotaReached && isLicenseExpired;
    } else {
      return false;
    }
  },
);
