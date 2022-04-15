import frame31Icon from './frame31Icon.svg';
import classes from './Logomark.module.css';

export function Logomark() {
  return (
    <div className={classes.root}>
      <img src={frame31Icon} alt='' className={classes.frame31} />
    </div>
  );
}
