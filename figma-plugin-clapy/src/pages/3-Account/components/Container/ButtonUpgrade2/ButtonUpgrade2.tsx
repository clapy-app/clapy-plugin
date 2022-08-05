import Button from '@mui/material/Button';
import type { FC } from 'react';
import { memo } from 'react';

import { useCallbackAsync2 } from '../../../../../common/front-utils.js';
import { dispatchOther } from '../../../../../core/redux/redux.utils.js';
import { showPricing } from '../../../stripe-slice.js';
import { _ButtonBase2 } from '../_ButtonBase2/_ButtonBase2';
import classes from './ButtonUpgrade2.module.css';

interface Props {
  className?: string;
}
export const ButtonUpgrade2: FC<Props> = memo(function ButtonUpgrade2(props = {}) {
  const showPricingPage = useCallbackAsync2(async () => {
    dispatchOther(showPricing());
  }, []);
  return (
    <Button className={`${classes.root} ${props.className || ''}`} onClick={showPricingPage}>
      <_ButtonBase2 />
    </Button>
  );
});
