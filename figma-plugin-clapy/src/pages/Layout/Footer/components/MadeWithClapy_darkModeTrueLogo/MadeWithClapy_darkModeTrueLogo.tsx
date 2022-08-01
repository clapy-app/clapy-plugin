import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { Logomark_modeLight } from '../Logomark_modeLight/Logomark_modeLight';
import { ClapyIcon } from './ClapyIcon';
import classes from './MadeWithClapy_darkModeTrueLogo.module.css';

interface Props {
  className?: string;
  swap?: {
    clapy?: ReactNode;
  };
  text?: {
    text?: ReactNode;
  };
}
/* @figmaId 358:97219 */
export const MadeWithClapy_darkModeTrueLogo: FC<Props> = memo(function MadeWithClapy_darkModeTrueLogo(props = {}) {
  return (
    <div className={classes.root}>
      <button className={classes._ButtonBase}>
        <div className={classes.frame66}>
          {props.text?.text != null ? props.text?.text : <div className={classes.text}>UI made by</div>}
        </div>
        <Logomark_modeLight
          className={classes.logomark}
          classes={{ clapy: classes.clapy }}
          swap={{
            clapy: props.swap?.clapy || (
              <div className={classes.clapy}>
                <ClapyIcon className={classes.icon} />
              </div>
            ),
          }}
        />
      </button>
    </div>
  );
});
