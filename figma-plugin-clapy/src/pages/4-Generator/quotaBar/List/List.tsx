import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './List.module.css';
import { ListIcon } from './ListIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 2072:146188 */
export const List: FC<Props> = memo(function List(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <ListIcon className={classes.icon2} />}</div>
    </div>
  );
});
