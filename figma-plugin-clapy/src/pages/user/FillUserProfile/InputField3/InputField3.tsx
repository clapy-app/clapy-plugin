import { FC, memo } from 'react';

import { _InputFieldBase3 } from '../_InputFieldBase3/_InputFieldBase3';
import classes from './InputField3.module.css';

interface Props {
  className?: string;
}
export const InputField3: FC<Props> = memo(function InputField3(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <_InputFieldBase3 />
    </div>
  );
});
