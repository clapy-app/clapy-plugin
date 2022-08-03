import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { Circle } from '../Circle/Circle';
import classes from './_ButtonBase_SizeSmIconTrailing.module.css';
import { CircleIcon } from './CircleIcon';

interface Props {
  className?: string;
  classes?: {
    circle?: string;
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
    circle?: ReactNode;
  };
  text?: {
    text?: ReactNode;
  };
}
/* @figmaId 1899:113011 */
export const _ButtonBase_SizeSmIconTrailing: FC<Props> = memo(function _ButtonBase_SizeSmIconTrailing(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      {props.text?.text != null ? props.text?.text : <div className={classes.text}>Button CTA</div>}
      {props.swap?.circle || (
        <Circle
          className={`${classes.circle} ${props.classes?.circle || ''}`}
          swap={{
            icon: props.swap?.icon || <CircleIcon className={classes.icon} />,
          }}
        />
      )}
    </div>
  );
});
