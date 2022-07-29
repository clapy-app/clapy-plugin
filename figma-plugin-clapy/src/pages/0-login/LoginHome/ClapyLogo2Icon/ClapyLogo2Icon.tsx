import { memo } from 'react';
import type { FC } from 'react';

import { ClapyIcon } from './ClapyIcon';
import classes from './ClapyLogo2Icon.module.css';
import { Logo_LogoFullStyleLinearDarkMo } from './Logo_LogoFullStyleLinearDarkMo/Logo_LogoFullStyleLinearDarkMo';
import { LogotypeIcon } from './LogotypeIcon';

interface Props {
  className?: string;
}
export const ClapyLogo2Icon: FC<Props> = memo(function ClapyLogo2Icon(props = {}) {
  return (
    <div className={classes.root}>
      <Logo_LogoFullStyleLinearDarkMo
        className={classes.logo}
        classes={{
          clapy: classes.clapy,
          logomark: classes.logomark,
          logotype: classes.logotype,
        }}
        swap={{
          clapy: (
            <div className={classes.clapy}>
              <ClapyIcon className={classes.icon} />
            </div>
          ),
          logotype: (
            <div className={classes.logotype}>
              <LogotypeIcon className={classes.icon2} />
            </div>
          ),
        }}
      />
    </div>
  );
});
