import { handleError } from '../../common/error-utils.js';
import { useCallbackAsync2 } from '../../common/front-utils.js';
import { refreshUser } from '../../core/auth/auth-service.js';
import { dispatchOther } from '../../core/redux/redux.utils.js';
import { env } from '../../environment/env.js';
import { showPaymentConfirmation, startLoadingStripe, stopLoadingStripe } from './stripe-slice.js';
import { upgradeUser } from './stripeLicense.js';

export function useHandleUserUpgrade() {
  return useCallbackAsync2(async () => {
    dispatchOther(startLoadingStripe());
    const eventSource = new EventSource(`${env.apiBaseUrl}/stripe/sse`);
    eventSource.onmessage = async e => {
      try {
        eventSource.close();
        let data = JSON.parse(e.data);
        if (data.status) {
          try {
            await refreshUser();
          } catch (e) {
            handleError(e);
          } finally {
            dispatchOther(showPaymentConfirmation());
          }
        }
      } catch (error: any) {
        handleError(error);
      } finally {
        dispatchOther(stopLoadingStripe());
      }
    };
    await upgradeUser();
  }, []);
}