import type { FC } from 'react';
import { memo } from 'react';

import { useCallbackAsync2 } from '../../../../../common/front-utils.js';
import { upgradeUser } from '../../../../../common/stripeLicense';
import { dispatchOther } from '../../../../../core/redux/redux.utils.js';
import { env } from '../../../../../environment/env.js';
import { startLoadingStripe, stopLoadingStripe } from '../../../stripe-slice.js';
import { _ButtonBase } from '../_ButtonBase/_ButtonBase';
import classes from './ButtonUpgrade.module.css';

interface Props {
  className?: string;
}
export const ButtonUpgrade: FC<Props> = memo(function ButtonUpgrade(props = {}) {
  const userUpgrade = useCallbackAsync2(() => {
    upgradeUser();
    dispatchOther(startLoadingStripe());
    const eventSource = new EventSource(`${env.apiBaseUrl}/stripe/sse`);
    eventSource.onmessage = e => {
      console.log(e.data);
      if (e.data === 'status: true') dispatchOther(stopLoadingStripe());
      eventSource.close();
    };
  }, []);
  return (
    <button className={`${classes.root} ${props.className || ''}`} onClick={userUpgrade}>
      <_ButtonBase />
    </button>
  );
});
