import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './_BadgeBase_IconFalse2.module.css';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  text?: {
    text?: ReactNode;
  };
}
/* @figmaId 1868:108400 */
export const _BadgeBase_IconFalse2: FC<Props> = memo(function _BadgeBase_IconFalse2(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      {props.text?.text != null ? props.text?.text : <div className={classes.text}>Label</div>}
    </div>
  );
});
