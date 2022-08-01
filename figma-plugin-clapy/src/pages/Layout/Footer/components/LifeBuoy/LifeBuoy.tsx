import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './LifeBuoy.module.css';
import { LifeBuoyIcon } from './LifeBuoyIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 190:40354 */
export const LifeBuoy: FC<Props> = memo(function LifeBuoy(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <LifeBuoyIcon className={classes.icon2} />}</div>
    </div>
  );
});
