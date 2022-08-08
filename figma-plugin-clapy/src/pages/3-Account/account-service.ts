import { refreshUser } from '../../core/auth/auth-service.js';
import { useAppDispatch } from '../../core/redux/hooks.js';
import { env } from '../../environment/env.js';
import { handleError, useCallbackAsync2 } from '../../front-utils/front-utils.js';
import { showPaymentConfirmation, startLoadingStripe, stopLoadingStripe } from './stripe-slice.js';
import { upgradeUser } from './stripeLicense.js';

export function useHandleUserUpgrade() {
  const dispatch = useAppDispatch();
  return useCallbackAsync2(async () => {
    dispatch(startLoadingStripe());
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
            dispatch(showPaymentConfirmation());
          }
        }
      } catch (error: any) {
        handleError(error);
      } finally {
        dispatch(stopLoadingStripe());
      }
    };
    await upgradeUser();
  }, [dispatch]);
}
