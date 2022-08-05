import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './Github.module.css';
import { GithubIcon } from './GithubIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 1782:119021 */
export const Github: FC<Props> = memo(function Github(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <GithubIcon className={classes.icon2} />}</div>
    </div>
  );
});
