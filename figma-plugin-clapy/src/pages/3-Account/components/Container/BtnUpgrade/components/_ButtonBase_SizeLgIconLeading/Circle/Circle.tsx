import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './Circle.module.css';
import { CircleIcon } from './CircleIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 10:7342 */
export const Circle: FC<Props> = memo(function Circle(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <CircleIcon className={classes.icon2} />}</div>
    </div>
  );
});
