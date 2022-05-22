import { FC, memo } from 'react';

import { _stepBaseIcon } from './_stepBaseIcon';
import { _stepBaseIcon2 } from './_stepBaseIcon2';
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
      <_stepBaseIcon className={`${classes._StepBase} ${props.classes?._StepBase || ''}`} />
      <_stepBaseIcon2 className={`${classes._StepBase2} ${props.classes?._StepBase2 || ''}`} />
    </div>
  );
});
