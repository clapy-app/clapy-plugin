import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { ClapyIcon } from './ClapyIcon';
import classes from './Logomark_modeDark.module.css';

interface Props {
  className?: string;
  classes?: {
    root?: string;
    clapy?: string;
  };
  swap?: {
    clapy?: ReactNode;
  };
}
/* @figmaId 398:104179 */
export const Logomark_modeDark: FC<Props> = memo(function Logomark_modeDark(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={`${classes.clapy} ${props.classes?.clapy || ''}`}>
        {props.swap?.clapy || <ClapyIcon className={classes.icon} />}
      </div>
    </div>
  );
});
