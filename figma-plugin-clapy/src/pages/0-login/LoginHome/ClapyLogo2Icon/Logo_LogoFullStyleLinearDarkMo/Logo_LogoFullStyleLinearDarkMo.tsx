import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './Logo_LogoFullStyleLinearDarkMo.module.css';
import { Logomark_modeDark } from './Logomark_modeDark/Logomark_modeDark';
import { LogotypeIcon } from './LogotypeIcon';

interface Props {
  className?: string;
  classes?: {
    clapy?: string;
    logomark?: string;
    logotype?: string;
    root?: string;
  };
  swap?: {
    clapy?: ReactNode;
    logotype?: ReactNode;
  };
}
/* @figmaId 1899:132971 */
export const Logo_LogoFullStyleLinearDarkMo: FC<Props> = memo(function Logo_LogoFullStyleLinearDarkMo(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <Logomark_modeDark
        className={`${classes.logomark} ${props.classes?.logomark || ''}`}
        classes={{ clapy: `${props.classes?.clapy || ''}` }}
        swap={{
          clapy: props.swap?.clapy,
        }}
      />
      <div className={`${classes.logotype} ${props.classes?.logotype || ''}`}>
        {props.swap?.logotype || <LogotypeIcon className={classes.icon} />}
      </div>
    </div>
  );
});
