import { FC, memo } from 'react';

import classes from './_ButtonBase.module.css';

interface Props {
  className?: string;
  classes?: {
    text?: string;
  };
}
export const _ButtonBase: FC<Props> = memo(function _ButtonBase(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <div className={`${classes.text} ${props.classes?.text || ''}`}>Next</div>
    </div>
  );
});
