import Button from '@mui/material/Button';
import type { FC } from 'react';
import { memo } from 'react';

import { useAppDispatch } from '../../../../../core/redux/hooks.js';
import { useCallbackAsync2 } from '../../../../../front-utils/front-utils.js';
import { showPricing } from '../../../stripe-slice.js';
import { _ButtonBase2 } from '../_ButtonBase2/_ButtonBase2';
import classes from './ButtonUpgrade2.module.css';

interface Props {
  className?: string;
}
export const ButtonUpgrade2: FC<Props> = memo(function ButtonUpgrade2(props = {}) {
  const dispatch = useAppDispatch();
  const showPricingPage = useCallbackAsync2(async () => {
    dispatch(showPricing());
  }, [dispatch]);
  return (
    <Button className={`${classes.root} ${props.className || ''}`} onClick={showPricingPage}>
      <_ButtonBase2 />
    </Button>
  );
});
