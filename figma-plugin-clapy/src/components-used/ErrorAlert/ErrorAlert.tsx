import type { FC, ReactNode } from 'react';
import { memo } from 'react';

import { MailIcon } from './_ButtonBase/MailIcon';
import { SlashIcon } from './_ButtonBase_2/SlashIcon';
import { BadgeGroup } from './BadgeGroup/BadgeGroup';
import { Button } from './Button/Button';
import classes from './ErrorAlert.module.css';
import { CheckCircleIcon } from './_ButtonBase/CheckCircleIcon.js';
import { ExternalLinkIcon } from './_ButtonBase_2/ExternalLinkIcon.js';

interface Props {
  // Like PropsWithChildren<...>
  children?: ReactNode;
  isInfo?: boolean;
  infoText?: string;
}

export const Alert: FC<Props> = memo(function ErrorAlert2(props) {
  let { children } = props;
  if (typeof children === 'string' && children.length > 150) {
    children = `${children.substring(0, 150)}...`;
  }
  return (
    <div className={classes.content}>
      <BadgeGroup isInfo={props.isInfo} infoText={props.isInfo ? props.infoText : undefined} />
      <div className={`${classes.supportingText} ${props.isInfo ? classes.supportingTextInfo : null}`}>{children}</div>
    </div>
  );
});

interface Props2 {
  closeToast: (e: React.MouseEvent<HTMLElement>) => void;
  emailLink: string;
  isInfo?: boolean;
}

export const ErrorAlertButtons: FC<Props2> = memo(function ErrorAlertButtons(props) {
  const { closeToast, emailLink } = props;
  return (
    <div className={`${classes.actions} ${props.isInfo ? classes.actionsInfo : null}`}>
      {props.isInfo ? (
        <>
          <Button isInfo={true} icon={<ExternalLinkIcon className={classes.icon} />} href={emailLink}>
            Learn more
          </Button>
          <Button isInfo={true} icon={<CheckCircleIcon className={classes.icon} />} onClick={closeToast}>
            Got it
          </Button>
        </>
      ) : (
        <>
          <Button icon={<MailIcon className={classes.icon} />} href={emailLink}>
            Report bug
          </Button>
          <Button icon={<SlashIcon className={classes.icon} />} onClick={closeToast}>
            Close
          </Button>
        </>
      )}
    </div>
  );
});
