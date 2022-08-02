import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './Upload.module.css';
import { UploadIcon } from './UploadIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 1434:122796 */
export const Upload: FC<Props> = memo(function Upload(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <UploadIcon className={classes.icon2} />}</div>
    </div>
  );
});
