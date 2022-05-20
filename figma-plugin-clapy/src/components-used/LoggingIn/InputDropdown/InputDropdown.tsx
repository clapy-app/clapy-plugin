import { FC, memo } from 'react';

import { _InputDropdownBase } from '../_InputDropdownBase/_InputDropdownBase';
import classes from './InputDropdown.module.css';

interface Props {
  className?: string;
}
export const InputDropdown: FC<Props> = memo(function InputDropdown(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <_InputDropdownBase />
    </div>
  );
});
