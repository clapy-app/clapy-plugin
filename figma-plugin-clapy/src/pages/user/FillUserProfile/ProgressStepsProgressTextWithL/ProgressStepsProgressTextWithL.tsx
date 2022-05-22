import { FC, memo } from 'react';

import classes from './ProgressStepsProgressTextWithL.module.css';

interface Props {
  className?: string;
  classes?: {
    _StepBase?: string;
    _StepBase2?: string;
  };
}
export const ProgressStepsProgressTextWithL: FC<Props> = memo(function ProgressStepsProgressTextWithL(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <div className={`${classes._StepBase} ${classes._StepBase1}`}></div>
      <div className={`${classes._StepBase} ${classes._StepBase2}`}></div>
    </div>
  );
});
