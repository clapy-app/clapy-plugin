import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { Logomark_modeLight } from '../Logomark_modeLight/Logomark_modeLight';
import { ClapyIcon } from './ClapyIcon';
import classes from './Logo_LogoFullStyleLinearModeLi.module.css';
import { VectorIcon } from './VectorIcon';

interface Props {
  className?: string;
  classes?: {
    logomark?: string;
  };
  swap?: {
    clapy?: ReactNode;
  };
  hide?: {
    vector?: boolean;
  };
}
/* @figmaId 1975:134666 */
export const Logo_LogoFullStyleLinearModeLi: FC<Props> = memo(function Logo_LogoFullStyleLinearModeLi(props = {}) {
  return (
    <div className={classes.root}>
      <Logomark_modeLight
        className={`${props.classes?.logomark || ''}`}
        swap={{
          clapy: props.swap?.clapy || <ClapyIcon className={classes.icon} />,
        }}
      />
      {!props.hide?.vector && (
        <div className={classes.vector}>
          <VectorIcon className={classes.icon2} />
        </div>
      )}
    </div>
  );
});
