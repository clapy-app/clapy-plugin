import classes from './Button.module.css';
import { _ButtonBase } from '../_ButtonBase/_ButtonBase';

export function Button() {
  return (
    <button className={classes.root}>
      <_ButtonBase />
    </button>
  );
}
