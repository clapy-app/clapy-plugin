import type { Operation } from 'urql';
import { gql, useClient } from 'urql';
import { pipe, subscribe } from 'wonka';

import type { Subscription_Root } from '../../../generated/schema.js';
import { refreshUser } from '../../core/auth/auth-service.js';
import { useAppDispatch } from '../../core/redux/hooks.js';
import { handleError, toastError, useCallbackAsync2 } from '../../front-utils/front-utils.js';
import { apiPost } from '../../front-utils/http.utils.js';
import { showPaymentConfirmation, startLoadingStripe, stopLoadingStripe } from './stripe-slice.js';
import { upgradeUser } from './stripeLicense.js';

const loginTokensSub = gql`
  subscription loginTokens {
    clapy_login_tokens {
      id
      user_id
      payment_status
    }
  }
`;

interface SubscriptionResp {
  data: Subscription_Root;
  error: any;
  extensions: any;
  hasNext: boolean;
  operation: Operation;
}

export function useHandleUserUpgrade() {
  const dispatch = useAppDispatch();
  const gqlClient = useClient();
  return useCallbackAsync2(async () => {
    dispatch(startLoadingStripe());

    // Set the payment status to 'start', first step of the workflow.
    await apiPost('stripe/reset-payment-status');

    // Subscribe to the payment status. This is a bunch of code to handle potential errors.
    let waitForPaymentStartStatus = true;
    const { unsubscribe } = pipe(
      gqlClient.subscription(loginTokensSub, {}) as any,
      subscribe<SubscriptionResp>(result => {
        // Wrap in async function because managing async error is easier.
        (async () => {
          try {
            const { error, data } = result;
            if (error) throw error;

            const {
              clapy_login_tokens: [clapyLoginTokenEntry],
            } = data;
            if (!clapyLoginTokenEntry) {
              throw new Error(
                `Bug: cannot start the payment, please let us know to fix the issue. (detail: cannot find the payment status in database.)`,
              );
            }

            const { payment_status } = clapyLoginTokenEntry;

            if (waitForPaymentStartStatus) {
              // Wait until we confirm the 'start' status is read from the client, i.e. Hasura has emitted the new value.
              if (payment_status === 'start') {
                waitForPaymentStartStatus = false;
                await upgradeUser();
              }
            } else {
              // After the payment has started, let's wait until it's completed.
              if (payment_status === 'completed') {
                await refreshUser();
                dispatch(showPaymentConfirmation());
                unsubscribe();
              } else if (payment_status === 'canceled') {
                dispatch(stopLoadingStripe());
                unsubscribe();
              } else {
                console.warn('Unsupported payment status after the payment has started:', payment_status);
              }
            }
          } catch (error) {
            handleError(error);
            toastError(error);
            dispatch(stopLoadingStripe());
            unsubscribe();
          }
        })();
      }),
    );
  }, [dispatch, gqlClient]);
}
