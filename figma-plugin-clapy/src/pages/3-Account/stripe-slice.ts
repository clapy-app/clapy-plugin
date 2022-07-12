import { createSlice } from '@reduxjs/toolkit';

import type { RootState } from '../../core/redux/store';

const initialState = { upgrading: false };

// To add to src/core/redux/store.ts
export const stripeSlice = createSlice({
  name: 'stripe',
  initialState,
  reducers: {
    startLoadingStripe: state => {
      state.upgrading = true;
    },
    stopLoadingStripe: state => {
      state.upgrading = false;
    },
  },
});
export const { startLoadingStripe, stopLoadingStripe } = stripeSlice.actions;

/**
 * Not undefined, which assumes the value is read after the authentication initial loading is completed
 * (selectAuthLoading === false)
 */
export const selectStripeState = (state: RootState) => state.stripe.upgrading;
