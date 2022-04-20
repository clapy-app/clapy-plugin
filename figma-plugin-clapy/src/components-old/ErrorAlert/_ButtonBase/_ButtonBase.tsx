import classes from './_ButtonBase.module.css';
import { MailIcon } from './MailIcon';

export function _ButtonBase() {
  return (
    <div className={classes.root}>
      <MailIcon className={classes.mail} />
      <div className={classes.text}>Report bug</div>
    </div>
  );
}
