import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { ClapyIcon } from './ClapyIcon';
import classes from './Logomark_modeLight.module.css';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    clapy?: ReactNode;
  };
}
/* @figmaId 1975:134573 */
export const Logomark_modeLight: FC<Props> = memo(function Logomark_modeLight(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.clapy}>{props.swap?.clapy || <ClapyIcon className={classes.icon} />}</div>
    </div>
  );
});
