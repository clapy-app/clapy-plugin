import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { LifeBuoy } from '../LifeBuoy/LifeBuoy';
import { MadeWithClapy_darkModeTrueLogo } from '../MadeWithClapy_darkModeTrueLogo/MadeWithClapy_darkModeTrueLogo';
import { Zap } from '../Zap/Zap';
import { ClapyIcon } from './ClapyIcon';
import classes from './Footer_styleLinearColorBlueVer.module.css';
import { LifeBuoyIcon } from './LifeBuoyIcon';
import { ZapIcon } from './ZapIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    clapy?: ReactNode;
    lifeBuoy?: ReactNode;
    zap?: ReactNode;
  };
  text?: {
    contactUsLink?: ReactNode;
    contactUsLink2?: ReactNode;
  };
}
/* @figmaId 1446:122919 */
export const Footer_styleLinearColorBlueVer: FC<Props> = memo(function Footer_styleLinearColorBlueVer(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <a
        href={'https://clapy.co?utm_source=plugin&utm_medium=button&utm_campaign=referral'}
        target='_blank'
        rel='noreferrer'
      >
        <MadeWithClapy_darkModeTrueLogo
          swap={{
            clapy: props.swap?.clapy || <ClapyIcon className={classes.icon} />,
          }}
          text={{
            text: <div className={classes.text}>Made with</div>,
          }}
        />
      </a>
      <a href='https://bit.ly/docs-footer' target={'_blank'} rel='noreferrer'>
        <div className={classes.frame69}>
          {props.swap?.lifeBuoy || (
            <LifeBuoy
              className={classes.lifeBuoy}
              swap={{
                icon: <LifeBuoyIcon className={classes.icon2} />,
              }}
            />
          )}
          {props.text?.contactUsLink != null ? (
            props.text?.contactUsLink
          ) : (
            <div className={classes.contactUsLink}>Help center</div>
          )}
        </div>
      </a>
      <a href='https://bit.ly/clapy-ds-plugin'>
        <div className={classes.frame70}>
          {props.swap?.zap || (
            <Zap
              className={classes.zap}
              swap={{
                icon: <ZapIcon className={classes.icon3} />,
              }}
            />
          )}
          {props.text?.contactUsLink2 != null ? (
            props.text?.contactUsLink2
          ) : (
            <div className={classes.contactUsLink2}>Quick feedback</div>
          )}
        </div>
      </a>
    </div>
  );
});
