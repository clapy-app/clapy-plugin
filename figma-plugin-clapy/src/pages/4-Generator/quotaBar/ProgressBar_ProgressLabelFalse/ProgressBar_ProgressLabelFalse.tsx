import { memo } from 'react';
import type { FC } from 'react';

import classes from './ProgressBar_ProgressLabelFalse.module.css';

interface Props {
  className?: string;
  classes?: {
    progress?: string;
  };
}
/* @figmaId 2027:135107 */
export const ProgressBar_ProgressLabelFalse: FC<Props> = memo(function ProgressBar_ProgressLabelFalse(props = {}) {
  return (
    <div className={classes.root}>
      <div className={classes.progressBar}>
        <div className={classes.background}></div>
        <div className={`${classes.progress} ${props.classes?.progress || ''}`}></div>
      </div>
    </div>
  );
});
