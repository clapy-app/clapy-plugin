import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './Share2.module.css';
import { Share2Icon } from './Share2Icon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 2046:148351 */
export const Share2: FC<Props> = memo(function Share2(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <Share2Icon className={classes.icon2} />}</div>
    </div>
  );
});
