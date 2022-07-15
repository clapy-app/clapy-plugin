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
    <div className={`${classes.root} ${props.className || ''}`}>
      <MailIcon className={`${classes.mail} ${props.classes?.mail || ''}`} />
      <div className={`${classes.text} ${props.classes?.text || ''}`}>Contact us to update your plan</div>
    </div>
  );
});
