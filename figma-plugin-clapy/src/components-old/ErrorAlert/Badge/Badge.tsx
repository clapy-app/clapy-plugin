import { _BadgeBase } from '../_BadgeBase/_BadgeBase';
import classes from './Badge.module.css';

export function Badge() {
  return (
    <div className={classes.root}>
      <_BadgeBase />
    </div>
  );
}
