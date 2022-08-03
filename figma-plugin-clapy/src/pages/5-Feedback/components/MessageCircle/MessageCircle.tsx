import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './MessageCircle.module.css';
import { MessageCircleIcon } from './MessageCircleIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 315:39038 */
export const MessageCircle: FC<Props> = memo(function MessageCircle(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <MessageCircleIcon className={classes.icon2} />}</div>
    </div>
  );
});
