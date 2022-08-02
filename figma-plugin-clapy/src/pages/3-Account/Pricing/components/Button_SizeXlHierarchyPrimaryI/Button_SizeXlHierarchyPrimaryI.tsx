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
}
/* @figmaId 10:8486 */
export const Button_SizeXlHierarchyPrimaryI: FC<Props> = memo(function Button_SizeXlHierarchyPrimaryI(props = {}) {
  return (
    <button className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <_ButtonBase_SizeXlIconFalse
        className={`${classes._ButtonBase} ${props.classes?._ButtonBase || ''}`}
        text={{
          text: props.text?.text,
        }}
      />
    </button>
  );
});
