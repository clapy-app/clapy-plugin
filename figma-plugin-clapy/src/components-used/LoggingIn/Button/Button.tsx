import { FC, memo } from 'react';

import { _ButtonBase } from '../_ButtonBase/_ButtonBase';
import classes from './Button.module.css';

interface Props {
  className?: string;
}
export const Button: FC<Props> = memo(function Button(props = {}) {
  return (
    <button className={`${classes.root} ${props.className || ''}`}>
      <_ButtonBase />
    </button>
  );
});
