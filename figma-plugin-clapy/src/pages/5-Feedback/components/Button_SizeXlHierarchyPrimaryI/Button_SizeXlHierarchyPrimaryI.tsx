import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { _ButtonBase_SizeXlIconLeading } from '../_ButtonBase_SizeXlIconLeading/_ButtonBase_SizeXlIconLeading';
import classes from './Button_SizeXlHierarchyPrimaryI.module.css';

interface Props {
  className?: string;
  classes?: {
    _ButtonBase?: string;
    root?: string;
  };
  swap?: {
    circle?: ReactNode;
  };
  text?: {
    text?: ReactNode;
  };
}
/* @figmaId 1899:113933 */
export const Button_SizeXlHierarchyPrimaryI: FC<Props> = memo(function Button_SizeXlHierarchyPrimaryI(props = {}) {
  return (
    <button className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <_ButtonBase_SizeXlIconLeading
        className={`${classes._ButtonBase} ${props.classes?._ButtonBase || ''}`}
        swap={{
          circle: props.swap?.circle,
        }}
        text={{
          text: props.text?.text,
        }}
      />
    </button>
  );
});
