import Button from '@mui/material/Button';
import type { FC } from 'react';
import { memo } from 'react';

import { _ButtonBase } from '../_ButtonBase/_ButtonBase';
import classes from './ButtonUpgrade.module.css';

interface Props {
  className?: string;
}

export const ButtonUpgrade: FC<Props> = memo(function ButtonUpgrade(props = {}) {
  return (
    <Button variant='contained' size={'medium'} className={`${classes.root} ${props.className || ''}`}>
      <_ButtonBase />
    </Button>
  );
});
