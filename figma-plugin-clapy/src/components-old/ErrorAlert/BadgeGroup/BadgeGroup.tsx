import { Badge } from '../Badge/Badge';
import classes from './BadgeGroup.module.css';

export function BadgeGroup() {
  return (
    <div className={classes.root}>
      <Badge />
      <div className={classes.message}>There was a problem with that action</div>
    </div>
  );
}
