import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './Download.module.css';
import { DownloadIcon } from './DownloadIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 2046:148134 */
export const Download: FC<Props> = memo(function Download(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <DownloadIcon className={classes.icon2} />}</div>
    </div>
  );
});
