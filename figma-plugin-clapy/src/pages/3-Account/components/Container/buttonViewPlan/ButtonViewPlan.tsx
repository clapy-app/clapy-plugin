import type { FC } from 'react';
import { memo } from 'react';

import classes from './ButtonViewPlan.module.css';

interface Props {
  className?: string;
  classes?: {
    text?: string;
  };
}
export const ButtonViewPlan: FC<Props> = memo(function ButtonViewPlan(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <div className={`${classes.text} ${props.classes?.text || ''}`}>See plan details</div>
    </div>
  );
});
