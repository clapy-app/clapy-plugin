import { Button } from '@mui/material';
import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { _ButtonBase_SizeXlIconFalse } from '../_ButtonBase_SizeXlIconFalse/_ButtonBase_SizeXlIconFalse';
import classes from './Button_SizeXlHierarchyPrimaryI.module.css';

interface Props {
  className?: string;
  classes?: {
    _ButtonBase?: string;
    root?: string;
  };
  text?: {
    text?: ReactNode;
  };
  href?: string;
  callback?: () => Promise<void>;
}
/* @figmaId 10:8486 */
export const Button_SizeXlHierarchyPrimaryI: FC<Props> = memo(function Button_SizeXlHierarchyPrimaryI(props = {}) {
  return (
    <Button
      href={props.href || ''}
      target={'_blank'}
      variant='contained'
      size={'medium'}
      className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}
      onClick={props.callback || undefined}
    >
      <_ButtonBase_SizeXlIconFalse
        className={`${classes._ButtonBase} ${props.classes?._ButtonBase || ''}`}
        text={{
          text: props.text?.text,
        }}
      />
    </Button>
  );
});
