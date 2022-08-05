import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './Users.module.css';
import { UsersIcon } from './UsersIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 190:40004 */
export const Users: FC<Props> = memo(function Users(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <UsersIcon className={classes.icon2} />}</div>
    </div>
  );
});
