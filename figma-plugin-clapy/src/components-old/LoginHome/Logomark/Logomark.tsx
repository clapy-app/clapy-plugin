import { Frame31Icon } from './Frame31Icon';
import classes from './Logomark.module.css';

export function Logomark() {
  return (
    <div className={classes.root}>
      <Frame31Icon className={classes.frame31} />
    </div>
  );
}
