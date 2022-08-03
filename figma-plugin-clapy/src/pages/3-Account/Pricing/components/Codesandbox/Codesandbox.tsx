import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './Codesandbox.module.css';
import { CodesandboxIcon } from './CodesandboxIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 1687:130963 */
export const Codesandbox: FC<Props> = memo(function Codesandbox(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <CodesandboxIcon className={classes.icon2} />}</div>
    </div>
  );
});
