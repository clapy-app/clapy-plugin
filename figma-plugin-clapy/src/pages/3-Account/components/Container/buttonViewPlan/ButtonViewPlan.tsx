import LoadingButton from '@mui/lab/LoadingButton/LoadingButton.js';
import type { FC } from 'react';
import { memo, useState } from 'react';

import { useCallbackAsync2 } from '../../../../../front-utils/front-utils.js';
import { openCustomerPortal } from '../../../stripeLicense.js';
import classes from './ButtonViewPlan.module.css';
import { CheckCircleIcon } from './CheckCircleIcon';

interface Props {
  className?: string;
  classes?: {
    text?: string;
  };
}
export const ButtonViewPlan: FC<Props> = memo(function ButtonViewPlan(props = {}) {
  const [loading, setLoading] = useState(false);
  const customerPortal = useCallbackAsync2(async () => {
    try {
      setLoading(true);
      await openCustomerPortal();
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <LoadingButton
        variant='contained'
        size='medium'
        className={`${classes.text} ${props.classes?.text || ''}`}
        onClick={customerPortal}
        loading={loading}
      >
        <CheckCircleIcon />
        &nbsp; See plan details
      </LoadingButton>
    </div>
  );
});
