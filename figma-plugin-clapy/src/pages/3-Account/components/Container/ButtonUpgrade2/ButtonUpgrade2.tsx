import { FC, memo } from 'react';

import { _ButtonBase2 } from '../_ButtonBase2/_ButtonBase2';
import classes from './ButtonUpgrade2.module.css';

interface Props {
  className?: string;
}
export const ButtonUpgrade2: FC<Props> = memo(function ButtonUpgrade2(props = {}) {
  return (
    <button className={`${classes.root} ${props.className || ''}`}>
      <_ButtonBase2 />
    </button>
  );
});
