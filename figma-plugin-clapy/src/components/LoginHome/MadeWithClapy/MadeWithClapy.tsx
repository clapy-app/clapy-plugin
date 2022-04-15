import { Logomark } from '../Logomark/Logomark';
import classes from './MadeWithClapy.module.css';

export function MadeWithClapy() {
  return (
    <div className={classes.root}>
      <button className={classes._ButtonBase}>
        <div className={classes.frame66}>
          <div className={classes.text}>UI made by</div>
        </div>
        <Logomark />
      </button>
    </div>
  );
}
