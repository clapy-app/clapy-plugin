import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './Clock.module.css';
import { ClockIcon } from './ClockIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 427:102447 */
export const Clock: FC<Props> = memo(function Clock(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <ClockIcon className={classes.icon2} />}</div>
    </div>
  );
});
