import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './Plus.module.css';
import { PlusIcon } from './PlusIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 14:11846 */
export const Plus: FC<Props> = memo(function Plus(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <PlusIcon className={classes.icon2} />}</div>
    </div>
  );
});
