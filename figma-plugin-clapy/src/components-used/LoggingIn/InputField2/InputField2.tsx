import { FC, memo } from 'react';

import { _InputFieldBase2 } from '../_InputFieldBase2/_InputFieldBase2';
import classes from './InputField2.module.css';

interface Props {
  className?: string;
}
export const InputField2: FC<Props> = memo(function InputField2(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <_InputFieldBase2 />
    </div>
  );
});
