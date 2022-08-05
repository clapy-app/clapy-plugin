import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './ArrowUpCircle.module.css';
import { ArrowUpCircleIcon } from './ArrowUpCircleIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 1682:130814 */
export const ArrowUpCircle: FC<Props> = memo(function ArrowUpCircle(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <ArrowUpCircleIcon className={classes.icon2} />}</div>
    </div>
  );
});
