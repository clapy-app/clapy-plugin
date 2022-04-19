import { MadeWithClapyButton } from '../MadeWithClapyButton/MadeWithClapyButton';
import { DiscordLinkIcon } from './DiscordLinkIcon';
import classes from './Footer.module.css';

export function Footer() {
  return (
    <div className={classes.root}>
      <MadeWithClapyButton />
      <div className={classes.contactUsLink}>Contact us</div>
      <DiscordLinkIcon className={classes.discordLink} />
    </div>
  );
}
