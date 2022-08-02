import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { Circle } from '../Circle/Circle';
import classes from './_ButtonBase_SizeMdIconOnly.module.css';
import { CircleIcon } from './CircleIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
    circle?: ReactNode;
  };
}
/* @figmaId 1899:112997 */
export const _ButtonBase_SizeMdIconOnly: FC<Props> = memo(function _ButtonBase_SizeMdIconOnly(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      {props.swap?.circle || (
        <Circle
          className={classes.circle}
          swap={{
            icon: props.swap?.icon || <CircleIcon className={classes.icon} />,
          }}
        />
      )}
    </div>
  );
});
