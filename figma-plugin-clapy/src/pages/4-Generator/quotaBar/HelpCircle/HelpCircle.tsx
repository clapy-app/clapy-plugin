import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './HelpCircle.module.css';
import { HelpCircleIcon } from './HelpCircleIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 27:13788 */
export const HelpCircle: FC<Props> = memo(function HelpCircle(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <HelpCircleIcon className={classes.icon2} />}</div>
    </div>
  );
});
