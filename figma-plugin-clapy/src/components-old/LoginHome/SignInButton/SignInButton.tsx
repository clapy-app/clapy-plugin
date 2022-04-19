import { _ButtonBase } from '../_ButtonBase/_ButtonBase';
import classes from './SignInButton.module.css';

export function SignInButton() {
  return (
    <button className={classes.root}>
      <_ButtonBase />
    </button>
  );
}
