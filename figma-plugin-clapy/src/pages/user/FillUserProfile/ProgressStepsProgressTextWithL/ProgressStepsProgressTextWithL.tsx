import type { FC } from 'react';
import { memo } from 'react';

import classes from './ProgressStepsProgressTextWithL.module.css';

interface Props {
  step2?: boolean;
  className?: string;
  classes?: {
    stepBase?: string;
    stepBase2?: string;
  };
}
export const ProgressStepsProgressTextWithL: FC<Props> = memo(function ProgressStepsProgressTextWithL(props = {}) {
  const { step2 } = props;
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <div className={`${classes.stepBase} ${classes.stepBase1}`}></div>
      <div className={`${classes.stepBase} ${step2 ? classes.stepBase1 : classes.stepBase2}`}></div>
    </div>
  );
});
