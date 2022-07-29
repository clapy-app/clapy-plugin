import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './File.module.css';
import { FileIcon } from './FileIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 27:18621 */
export const File: FC<Props> = memo(function File(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <FileIcon className={classes.icon2} />}</div>
    </div>
  );
});
