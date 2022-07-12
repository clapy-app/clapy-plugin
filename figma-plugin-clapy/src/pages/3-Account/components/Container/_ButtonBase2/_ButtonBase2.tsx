import { FC, memo } from 'react';

import classes from './_ButtonBase2.module.css';

interface Props {
  className?: string;
  classes?: {
    text?: string;
  };
}
export const _ButtonBase2: FC<Props> = memo(function _ButtonBase2(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <div className={`${classes.text} ${props.classes?.text || ''}`}>Compare plans</div>
    </div>
  );
});
