import { ArrowLeftIcon } from './ArrowLeftIcon';
import classes from './_ButtonBase_3.module.css';

export function _ButtonBase_3() {
  return (
    <div className={classes.root}>
      <ArrowLeftIcon className={classes.arrowLeft} />
      <div className={classes.text}>Generate more code</div>
    </div>
  );
}
