import { _ButtonBase } from '../_ButtonBase/_ButtonBase';
import classes from './Button.module.css';

export function Button() {
  return (
    <button className={classes.root}>
      <_ButtonBase />
    </button>
  );
}
