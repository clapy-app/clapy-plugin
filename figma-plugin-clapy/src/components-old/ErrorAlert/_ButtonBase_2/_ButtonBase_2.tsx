import { SlashIcon } from './SlashIcon';
import classes from './_ButtonBase_2.module.css';

export function _ButtonBase_2() {
  return (
    <div className={classes.root}>
      <SlashIcon className={classes.slash} />
      <div className={classes.text}>Close</div>
    </div>
  );
}
