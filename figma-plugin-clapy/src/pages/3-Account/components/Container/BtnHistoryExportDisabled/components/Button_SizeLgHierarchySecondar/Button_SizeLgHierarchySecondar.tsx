import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { _ButtonBase_SizeLgIconLeading } from './_ButtonBase_SizeLgIconLeading/_ButtonBase_SizeLgIconLeading';
import classes from './Button_SizeLgHierarchySecondar.module.css';
import { CircleIcon } from './CircleIcon';

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
/* @figmaId 1899:113527 */
export const Button_SizeLgHierarchySecondar: FC<Props> = memo(function Button_SizeLgHierarchySecondar(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <_ButtonBase_SizeLgIconLeading
        className={`${classes._ButtonBase} ${props.classes?._ButtonBase || ''}`}
        swap={{
          icon: <CircleIcon className={classes.icon} />,
          circle: props.swap?.circle,
        }}
        text={{
          text: props.text?.text || <div className={classes.text}>Button CTA</div>,
        }}
      />
    </div>
  );
});
