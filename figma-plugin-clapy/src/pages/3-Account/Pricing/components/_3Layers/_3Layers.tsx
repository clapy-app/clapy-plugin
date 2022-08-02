import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './_3Layers.module.css';
import { _3LayersIcon } from './_3LayersIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 27:18442 */
export const _3Layers: FC<Props> = memo(function _3Layers(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <_3LayersIcon className={classes.icon2} />}</div>
    </div>
  );
});
