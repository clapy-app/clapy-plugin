import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { Circle } from '../Circle/Circle';
import classes from './_ButtonBase_SizeMdIconLeading.module.css';
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
  text?: {
    text?: ReactNode;
  };
}
/* @figmaId 1899:112987 */
export const _ButtonBase_SizeMdIconLeading: FC<Props> = memo(function _ButtonBase_SizeMdIconLeading(props = {}) {
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
      {props.text?.text != null ? props.text?.text : <div className={classes.text}>Button CTA</div>}
    </div>
  );
});
