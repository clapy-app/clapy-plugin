import Button from '@mui/material/Button';
import type { FC } from 'react';
import { memo } from 'react';

import { useCallbackAsync2 } from '../../../../../common/front-utils.js';
import { openCustomerPortal } from '../../../../../common/stripeLicense.js';
import classes from './ButtonViewPlan.module.css';

interface Props {
  className?: string;
  classes?: {
    text?: string;
  };
}
export const ButtonViewPlan: FC<Props> = memo(function ButtonViewPlan(props = {}) {
  const customerPortal = useCallbackAsync2(async () => {
    await openCustomerPortal();
  }, []);

  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <Button
        variant='contained'
        size='medium'
        className={`${classes.text} ${props.classes?.text || ''}`}
        onClick={customerPortal}
      >
        See plan details
      </Button>
    </div>
  );
});
