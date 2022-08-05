import { memo } from 'react';
import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { selectUserMaxQuota, selectUserQuota } from '../../../user/user-slice.js';
import classes from './ProgressBar_ProgressLabelFalse.module.css';

interface Props {
  className?: string;
  classes?: {
    progress?: string;
  };
}
/* @figmaId 2027:135107 */
export const ProgressBar_ProgressLabelFalse: FC<Props> = memo(function ProgressBar_ProgressLabelFalse(props = {}) {
  let quota = useSelector(selectUserQuota);
  const quotaMax = useSelector(selectUserMaxQuota);
  if (quota > quotaMax) quota = quotaMax;
  return (
    <div className={classes.root}>
      <div className={classes.progressBar}>
        <div className={classes.background}></div>
        <div className={`${classes.progress}`} style={{ width: `${100 / (quotaMax / quota)}%` }}></div>
      </div>
    </div>
  );
});
