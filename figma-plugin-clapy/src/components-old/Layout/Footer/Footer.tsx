import { MadeWithClapy } from '../MadeWithClapy/MadeWithClapy';
import { DiscordLogoIcon } from './DiscordLogoIcon';
import classes from './Footer.module.css';

export function Footer() {
  return (
    <div className={classes.root}>
      <MadeWithClapy />
      {/* Or mailto:support@clapy.co?subject=Hello%20to%20Clapy%20team&body=Hey%20Clapy%20team%2C%0D%0A%0D%0AI%20am%20using%20your%20plugin%20and%20wanted%20to%20contact%20you.%0D%0A%0D%0AXXX */}
      <a href='https://clapy.co/contact' target='_blank' className={classes.contactUs} rel='noreferrer'>
        Contact us
      </a>
      <a href='https://bit.ly/clapy-discord-footer' target='_blank' rel='noreferrer' className={classes.discordLink}>
        <DiscordLogoIcon className={classes.discordLogo} />
      </a>
    </div>
  );
}
