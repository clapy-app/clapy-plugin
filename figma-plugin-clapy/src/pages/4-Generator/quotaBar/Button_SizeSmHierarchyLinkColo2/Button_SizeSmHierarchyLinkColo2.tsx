import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { _ButtonBase_SizeSmIconTrailing } from '../_ButtonBase_SizeSmIconTrailing/_ButtonBase_SizeSmIconTrailing';
import classes from './Button_SizeSmHierarchyLinkColo2.module.css';
import { CircleIcon } from './CircleIcon';

interface Props {
  className?: string;
  swap?: {
    circle?: ReactNode;
  };
  text?: {
    text?: ReactNode;
  };
}
/* @figmaId 1899:114529 */
export const Button_SizeSmHierarchyLinkColo2: FC<Props> = memo(function Button_SizeSmHierarchyLinkColo2(props = {}) {
  return (
    <button>
      <_ButtonBase_SizeSmIconTrailing
        className={classes._ButtonBase}
        classes={{ circle: classes.circle }}
        swap={{
          icon: <CircleIcon className={classes.icon} />,
          circle: props.swap?.circle,
        }}
        text={{
          text: props.text?.text || <div className={classes.text}>Button CTA</div>,
        }}
      />
    </button>
  );
});
