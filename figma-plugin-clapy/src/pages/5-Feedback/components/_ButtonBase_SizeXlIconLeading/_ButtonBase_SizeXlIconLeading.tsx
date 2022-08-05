import Button from '@mui/material/Button';
import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { Circle } from '../Circle/Circle';
import classes from './_ButtonBase_SizeXlIconLeading.module.css';
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
/* @figmaId 1899:112991 */
export const _ButtonBase_SizeXlIconLeading: FC<Props> = memo(function _ButtonBase_SizeXlIconLeading(props = {}) {
  return (
    <div className={classes.root}>
      <Button
        href='https://bit.ly/feedback-chat-clapy'
        target={'_blank'}
        variant='contained'
        size={'medium'}
        className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}
      >
        {props.swap?.circle || (
          <Circle
            className={classes.circle}
            swap={{
              icon: <CircleIcon className={classes.icon} />,
            }}
          />
        )}
        {props.text?.text != null ? props.text?.text : <div className={classes.text}>Button CTA</div>}
      </Button>
    </div>
  );
});
