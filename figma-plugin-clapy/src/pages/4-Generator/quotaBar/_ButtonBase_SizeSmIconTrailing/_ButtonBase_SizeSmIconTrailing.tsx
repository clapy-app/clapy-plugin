import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './_ButtonBase_SizeSmIconTrailing.module.css';

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
      {props.swap?.circle}
    </div>
  );
});
