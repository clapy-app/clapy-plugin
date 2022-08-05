import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './BadgeMadeWithClapy_modeLightFi.module.css';
import { ClapyIcon } from './ClapyIcon';
import { Logo_LogoFullStyleLinearModeLi } from './Logo_LogoFullStyleLinearModeLi/Logo_LogoFullStyleLinearModeLi';

interface Props {
  className?: string;
  swap?: {
    clapy?: ReactNode;
  };
  text?: {
    text?: ReactNode;
  };
}
/* @figmaId 1980:133668 */
export const BadgeMadeWithClapy_modeLightFi: FC<Props> = memo(function BadgeMadeWithClapy_modeLightFi(props = {}) {
  return (
    <div className={classes.root}>
      <button className={classes._ButtonBase}>
        {props.text?.text != null ? props.text?.text : <div className={classes.text}>UI made by</div>}
        <Logo_LogoFullStyleLinearModeLi
          classes={{ logomark: classes.logomark }}
          swap={{
            clapy: props.swap?.clapy || <ClapyIcon className={classes.icon} />,
          }}
          hide={{
            vector: true,
          }}
        />
      </button>
    </div>
  );
});
