import { FC, memo } from 'react';

import classes from './_BadgeBase2.module.css';
import { ClockIcon } from './ClockIcon';

interface Props {
  className?: string;
  classes?: {
    clock?: string;
    text?: string;
  };
}
export const _BadgeBase2: FC<Props> = memo(function _BadgeBase2(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <ClockIcon className={`${classes.clock} ${props.classes?.clock || ''}`} />
      <div className={`${classes.text} ${props.classes?.text || ''}`}>Trial ends in 10 days</div>
    </div>
  );
});
