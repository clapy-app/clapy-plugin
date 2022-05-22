import { FC, memo } from 'react';

import { _InputDropdownBase2 } from '../_InputDropdownBase2/_InputDropdownBase2';
import classes from './InputDropdown2.module.css';

interface Props {
  className?: string;
}
export const InputDropdown2: FC<Props> = memo(function InputDropdown2(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <_InputDropdownBase2 />
    </div>
  );
});
