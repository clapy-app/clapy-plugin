import Button from '@mui/material/Button';
import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { useHandleUserUpgrade } from '../../../../../account-service.js';
import classes from './_ButtonBase_SizeLgIconLeading.module.css';
import { Circle } from './Circle/Circle';
import { CircleIcon } from './CircleIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    circle?: ReactNode;
  };
  text?: {
    text?: ReactNode;
  };
}
/* @figmaId 1899:112989 */
export const _ButtonBase_SizeLgIconLeading: FC<Props> = memo(function _ButtonBase_SizeLgIconLeading(props = {}) {
  const userUpgrade = useHandleUserUpgrade();

  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <Button variant={'contained'} onClick={userUpgrade} className={`${classes.btn} `}>
        {props.swap?.circle || (
          <Circle
            className={classes.circle}
            swap={{
              icon: <CircleIcon className={classes.icon} />,
            }}
          />
        )}
        &nbsp;
        {props.text?.text != null ? props.text?.text : <div className={classes.text}>Button CTA</div>}
      </Button>
    </div>
  );
});
