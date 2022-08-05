import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './Link.module.css';
import { LinkIcon } from './LinkIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 27:41780 */
export const Link: FC<Props> = memo(function Link(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <LinkIcon className={classes.icon2} />}</div>
    </div>
  );
});
