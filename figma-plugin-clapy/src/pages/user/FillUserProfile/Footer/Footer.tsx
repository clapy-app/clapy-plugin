import { FC, memo } from 'react';

import { MadeWithClapyButton } from '../MadeWithClapyButton/MadeWithClapyButton';
import { DiscordLinkIcon } from './DiscordLinkIcon';
import classes from './Footer.module.css';

interface Props {
  className?: string;
  classes?: {
    contactUsLink?: string;
    discordLink?: string;
  };
}
export const Footer: FC<Props> = memo(function Footer(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <MadeWithClapyButton />
      <div className={`${classes.contactUsLink} ${props.classes?.contactUsLink || ''}`}>Contact us</div>
      <DiscordLinkIcon className={`${classes.discordLink} ${props.classes?.discordLink || ''}`} />
    </div>
  );
});
