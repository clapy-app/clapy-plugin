import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './ArrowLeft.module.css';
import { ArrowLeftIcon } from './ArrowLeftIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 16:13006 */
export const ArrowLeft: FC<Props> = memo(function ArrowLeft(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <ArrowLeftIcon className={classes.icon2} />}</div>
    </div>
  );
});
