import Button from '@mui/material/Button';
import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { handleError } from '../../../../../../../common/error-utils.js';
import { useCallbackAsync2 } from '../../../../../../../common/front-utils.js';
import { upgradeUser } from '../../../../../../../common/stripeLicense.js';
import { checkSessionComplete, refreshTokens } from '../../../../../../../core/auth/auth-service.js';
import { dispatchOther } from '../../../../../../../core/redux/redux.utils.js';
import { env } from '../../../../../../../environment/env.js';
import { setStripeData } from '../../../../../../user/user-slice.js';
import { showPaymentConfirmation, startLoadingStripe, stopLoadingStripe } from '../../../../../stripe-slice.js';
import classes from './_ButtonBase_SizeLgIconLeading.module.css';
import { Circle } from './Circle/Circle';
import { CircleIcon } from './CircleIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    circle?: ReactNode;
  };
  text?: {
    text?: ReactNode;
  };
}
interface ApiResponse {
  ok: boolean;
  quotas?: number;
  isLicenceExpired?: boolean;
}
/* @figmaId 1899:112989 */
export const _ButtonBase_SizeLgIconLeading: FC<Props> = memo(function _ButtonBase_SizeLgIconLeading(props = {}) {
  const userUpgrade = useCallbackAsync2(async () => {
    dispatchOther(startLoadingStripe());
    const eventSource = new EventSource(`${env.apiBaseUrl}/stripe/sse`);
    eventSource.onmessage = async e => {
      let data = JSON.parse(e.data);
      if (data.status) {
        try {
          await refreshTokens();
          const res = (await checkSessionComplete()) as ApiResponse;

          dispatchOther(setStripeData(res));
        } catch (e) {
          handleError(e);
        } finally {
          dispatchOther(showPaymentConfirmation());
          dispatchOther(stopLoadingStripe());
        }
      }
      eventSource.close();
    };
    await upgradeUser();
  }, []);

  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <Button variant={'contained'} onClick={userUpgrade} className={`${classes.btn} `}>
        {props.swap?.circle || (
          <Circle
            className={classes.circle}
            swap={{
              icon: <CircleIcon className={classes.icon} />,
            }}
          />
        )}
        &nbsp;
        {props.text?.text != null ? props.text?.text : <div className={classes.text}>Button CTA</div>}
      </Button>
    </div>
  );
});
