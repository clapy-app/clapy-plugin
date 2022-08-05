import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './Code.module.css';
import { CodeIcon } from './CodeIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 27:53048 */
export const Code: FC<Props> = memo(function Code(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <CodeIcon className={classes.icon2} />}</div>
    </div>
  );
});
