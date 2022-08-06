import { handleError } from '../../common/error-utils.js';
import { useCallbackAsync2 } from '../../common/front-utils.js';
import { upgradeUser } from '../../common/stripeLicense.js';
import { checkSessionComplete } from '../../core/auth/auth-service.js';
import { dispatchOther } from '../../core/redux/redux.utils.js';
import { env } from '../../environment/env.js';
import { setStripeData } from '../user/user-slice.js';
import { showPaymentConfirmation, startLoadingStripe, stopLoadingStripe } from './stripe-slice.js';

interface ApiResponse {
  ok: boolean;
  quotas?: number;
  isLicenceExpired?: boolean;
}

export function useHandleUserUpgrade() {
  return useCallbackAsync2(async () => {
    dispatchOther(startLoadingStripe());
    const eventSource = new EventSource(`${env.apiBaseUrl}/stripe/sse`);
    eventSource.onmessage = async e => {
      let data = JSON.parse(e.data);
      console.log('data.status:', data.status);
      if (data.status) {
        try {
          const res = (await checkSessionComplete()) as ApiResponse;
          if (res.quotas != null || !res.isLicenceExpired) {
            dispatchOther(setStripeData(res));
          }
        } catch (e) {
          handleError(e);
        } finally {
          dispatchOther(showPaymentConfirmation());
        }
      } else if (data.status === false) {
        dispatchOther(stopLoadingStripe());
      }
      eventSource.close();
    };
    await upgradeUser();
  }, []);
}
