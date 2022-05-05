import { FC, memo } from 'react';

import { MailIcon } from './_ButtonBase/MailIcon';
import { SlashIcon } from './_ButtonBase_2/SlashIcon';
import { BadgeGroup } from './BadgeGroup/BadgeGroup';
import { Button } from './Button/Button';
import classes from './ErrorAlert.module.css';

interface Props {}

export const ErrorAlert2: FC<Props> = memo(function ErrorAlert2(props) {
  let { children } = props;
  if (typeof children === 'string' && children.length > 150) {
    children = `${children.substring(0, 150)}...`;
  }
  return (
    <div className={classes.content}>
      <BadgeGroup />
      <div className={classes.supportingText}>{children}</div>
    </div>
  );
});

interface Props2 {
  closeToast: () => () => void;
  emailLink: string;
}

export const ErrorAlertButtons: FC<Props2> = memo(function ErrorAlertButtons(props) {
  const { closeToast, emailLink } = props;
  return (
    <div className={classes.actions}>
      <Button icon={<MailIcon className={classes.icon} />} href={emailLink}>
        Report bug
      </Button>
      <Button icon={<SlashIcon className={classes.icon} />} onClick={() => closeToast()}>
        Close
      </Button>
    </div>
  );
});
