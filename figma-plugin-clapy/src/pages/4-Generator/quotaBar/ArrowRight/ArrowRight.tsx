import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './ArrowRight.module.css';
import { ArrowRightIcon } from './ArrowRightIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 14:11842 */
export const ArrowRight: FC<Props> = memo(function ArrowRight(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <ArrowRightIcon className={classes.icon2} />}</div>
    </div>
  );
});
