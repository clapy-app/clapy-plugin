import { Logomark } from '../Logomark/Logomark';
import classes from './MadeWithClapyButton.module.css';

export function MadeWithClapyButton() {
  return (
    <button className={classes.root}>
      <div className={classes._ButtonBase}>
        <div className={classes.frame66}>
          <div className={classes.text}>UI made by</div>
        </div>
        <Logomark />
      </div>
    </button>
  );
}
