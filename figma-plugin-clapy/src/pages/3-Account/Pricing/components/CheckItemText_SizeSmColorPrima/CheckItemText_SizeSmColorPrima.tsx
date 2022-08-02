import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { CheckIcon_SizeSmColorPrimary } from '../CheckIcon_SizeSmColorPrimary/CheckIcon_SizeSmColorPrimary';
import classes from './CheckItemText_SizeSmColorPrima.module.css';

interface Props {
  className?: string;
  hide?: {
    checkIcon?: boolean;
  };
  text?: {
    text?: ReactNode;
  };
}
/* @figmaId 315:43616 */
export const CheckItemText_SizeSmColorPrima: FC<Props> = memo(function CheckItemText_SizeSmColorPrima(props = {}) {
  return (
    <div className={classes.root}>
      {!props.hide?.checkIcon && <CheckIcon_SizeSmColorPrimary />}
      <div className={classes.textWrap}>
        {props.text?.text != null ? (
          props.text?.text
        ) : (
          <div className={classes.text}>All features and premium support</div>
        )}
      </div>
    </div>
  );
});
