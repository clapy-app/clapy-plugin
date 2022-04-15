import { MadeWithClapy } from '../MadeWithClapy/MadeWithClapy';
import discordLogoIcon from './discordLogoIcon.svg';
import classes from './Frame57.module.css';

export function Frame57() {
  return (
    <div className={classes.root}>
      <MadeWithClapy />
      <div className={classes.contactUs}>Contact us</div>
      <img src={discordLogoIcon} alt='' className={classes.discordLogo} />
    </div>
  );
}
