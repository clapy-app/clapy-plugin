import { FC, memo } from 'react';

import { _InputFieldBase } from '../_InputFieldBase/_InputFieldBase';
import classes from './InputField.module.css';

interface Props {
  className?: string;
}
export const InputField: FC<Props> = memo(function InputField(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <_InputFieldBase />
    </div>
  );
});
