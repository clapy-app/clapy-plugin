import Button from '@mui/material/Button';
import type { FC } from 'react';
import { memo } from 'react';

import classes from './ButtonContact.module.css';
import { MailIcon } from './MailIcon.js';

interface Props {
  className?: string;
  classes?: {
    mail?: string;
    text?: string;
  };
}
export const ButtonContact: FC<Props> = memo(function ButtonContact(props = {}) {
  return (
    <Button
      className={`${classes.root} ${props.className || ''}`}
      href={'https://calendly.com/matthieul/support-clapy-30'}
      target='_blank'
      rel='noreferrer'
    >
      <MailIcon className={`${classes.mail} ${props.classes?.mail || ''}`} />
      <div className={`${classes.text} ${props.classes?.text || ''}`}>Contact us to update your plan</div>
    </Button>
  );
});
