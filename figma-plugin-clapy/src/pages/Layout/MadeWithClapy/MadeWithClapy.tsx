import { Logomark } from '../Logomark/Logomark';
import classes from './MadeWithClapy.module.css';

export function MadeWithClapy() {
  return (
    <a
      className={classes.root}
      href={'https://clapy.co?utm_source=plugin&utm_medium=button&utm_campaign=referral'}
      target='_blank'
      rel='noreferrer'
    >
      <div className={classes.buttonBase}>
        <div className={classes.frame66}>
          <div className={classes.text}>UI made by</div>
        </div>
        <Logomark />
      </div>
    </a>
  );
}