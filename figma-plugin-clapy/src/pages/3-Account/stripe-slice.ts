import { createSlice } from '@reduxjs/toolkit';

import type { RootState } from '../../core/redux/store';

const initialState = { upgrading: false, paymentConfirmation: false, showPricing: false, showFeedback: false };

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
    showPaymentConfirmation: state => {
      state.paymentConfirmation = true;
    },
    hidePaymentConfirmation: state => {
      state.paymentConfirmation = false;
    },
    showPricing: state => {
      state.showPricing = true;
    },
    hidePricing: state => {
      state.showPricing = false;
    },
    showFeedback: state => {
      state.showFeedback = true;
    },
    hideFeedback: state => {
      state.showFeedback = false;
    },
  },
});
export const {
  startLoadingStripe,
  stopLoadingStripe,
  showPaymentConfirmation,
  hidePaymentConfirmation,
  showPricing,
  hidePricing,
  showFeedback,
  hideFeedback,
} = stripeSlice.actions;

/**
 * Not undefined, which assumes the value is read after the authentication initial loading is completed
 * (selectAuthLoading === false)
 */
export const selectStripeState = (state: RootState) => state.stripe.upgrading;
export const selectPaymentConfirmation = (state: RootState) => state.stripe.paymentConfirmation;
export const selectPricingPageState = (state: RootState) => state.stripe.showPricing;
export const selectFeedbackPageState = (state: RootState) => state.stripe.showFeedback;
