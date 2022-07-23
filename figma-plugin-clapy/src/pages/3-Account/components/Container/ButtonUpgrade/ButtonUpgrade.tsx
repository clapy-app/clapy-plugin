import type { FC } from 'react';
import { memo } from 'react';

import { useCallbackAsync2 } from '../../../../../common/front-utils.js';
import { upgradeUser } from '../../../../../common/stripeLicense';
import { refreshTokens } from '../../../../../core/auth/auth-service.js';
import { dispatchOther } from '../../../../../core/redux/redux.utils.js';
import { env } from '../../../../../environment/env.js';
import { startLoadingStripe, stopLoadingStripe } from '../../../stripe-slice.js';
import { _ButtonBase } from '../_ButtonBase/_ButtonBase';
import classes from './ButtonUpgrade.module.css';

interface Props {
  className?: string;
}
export const ButtonUpgrade: FC<Props> = memo(function ButtonUpgrade(props = {}) {
  const userUpgrade = useCallbackAsync2(async () => {
    dispatchOther(startLoadingStripe());
    const eventSource = new EventSource(`${env.apiBaseUrl}/stripe/sse`);
    eventSource.onmessage = async e => {
      let data = JSON.parse(e.data);
      if (data.status) {
        dispatchOther(stopLoadingStripe());
        await refreshTokens();
        // await fetchUserMetadata();
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
