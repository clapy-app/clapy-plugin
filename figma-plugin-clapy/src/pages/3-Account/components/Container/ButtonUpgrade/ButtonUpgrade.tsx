import { FC, memo } from 'react';

import { _ButtonBase } from '../_ButtonBase/_ButtonBase';
import classes from './ButtonUpgrade.module.css';

interface Props {
  className?: string;
}
export const ButtonUpgrade: FC<Props> = memo(function ButtonUpgrade(props = {}) {
  return (
    <button className={`${classes.root} ${props.className || ''}`}>
      <_ButtonBase />
    </button>
  );
});
