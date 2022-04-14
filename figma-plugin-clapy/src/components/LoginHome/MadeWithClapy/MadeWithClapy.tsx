import classes from './MadeWithClapy.module.css';
import { Logomark } from '../Logomark/Logomark';

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
