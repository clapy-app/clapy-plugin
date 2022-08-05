import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { Checkbox_CheckedFalseIndetermi2 } from '../Checkbox_CheckedFalseIndetermi2/Checkbox_CheckedFalseIndetermi2';
import classes from './Checkbox_CheckedFalseIndetermi.module.css';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    checkbox?: ReactNode;
  };
  text?: {
    text?: ReactNode;
  };
}
/* @figmaId 1899:112454 */
export const Checkbox_CheckedFalseIndetermi: FC<Props> = memo(function Checkbox_CheckedFalseIndetermi(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      {props.swap?.checkbox || <Checkbox_CheckedFalseIndetermi2 />}
      {props.text?.text != null ? props.text?.text : <div className={classes.text}>Remember me</div>}
    </div>
  );
});
