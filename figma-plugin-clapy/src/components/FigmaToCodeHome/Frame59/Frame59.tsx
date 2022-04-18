import { MadeWithClapy } from '../MadeWithClapy/MadeWithClapy';
import { DiscordLogoIcon } from './DiscordLogoIcon';
import classes from './Frame59.module.css';

export function Frame59() {
  return (
    <div className={classes.root}>
      <MadeWithClapy />
      <div className={classes.contactUs}>Contact us</div>
      <DiscordLogoIcon className={classes.discordLogo} />
    </div>
  );
}
