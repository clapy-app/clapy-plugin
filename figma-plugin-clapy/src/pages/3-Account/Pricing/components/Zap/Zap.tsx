import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './Zap.module.css';
import { ZapIcon } from './ZapIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 27:13009 */
export const Zap: FC<Props> = memo(function Zap(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <ZapIcon className={classes.icon2} />}</div>
    </div>
  );
});
