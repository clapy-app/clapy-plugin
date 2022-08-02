import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './Rocket.module.css';
import { RocketIcon } from './RocketIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 1941:132352 */
export const Rocket: FC<Props> = memo(function Rocket(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <RocketIcon className={classes.icon2} />}</div>
    </div>
  );
});
