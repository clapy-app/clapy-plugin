import type { FC } from 'react';
import { memo } from 'react';

import { handleError } from '../../../../../common/error-utils.js';
import { useCallbackAsync2 } from '../../../../../common/front-utils.js';
import { upgradeUser } from '../../../../../common/stripeLicense';
import { checkSessionComplete } from '../../../../../core/auth/auth-service.js';
import { dispatchOther } from '../../../../../core/redux/redux.utils.js';
import { env } from '../../../../../environment/env.js';
import { setStripeData } from '../../../../user/user-slice.js';
import { showPaymentConfirmation, startLoadingStripe, stopLoadingStripe } from '../../../stripe-slice.js';
import { _ButtonBase } from '../_ButtonBase/_ButtonBase';
import classes from './ButtonUpgrade.module.css';

interface Props {
  className?: string;
}

interface ApiResponse {
  ok: boolean;
  quotas?: number;
  isLicenceExpired?: boolean;
}

export const ButtonUpgrade: FC<Props> = memo(function ButtonUpgrade(props = {}) {
  const userUpgrade = useCallbackAsync2(async () => {
    dispatchOther(startLoadingStripe());
    const eventSource = new EventSource(`${env.apiBaseUrl}/stripe/sse`);
    eventSource.onmessage = async e => {
      let data = JSON.parse(e.data);
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
          dispatchOther(stopLoadingStripe());
        }
        eventSource.close();
      }
      eventSource.close();
    };
    await upgradeUser();
  }, []);
  return (
    <button className={`${classes.root} ${props.className || ''}`} onClick={userUpgrade}>
      <_ButtonBase />
    </button>
  );
});
