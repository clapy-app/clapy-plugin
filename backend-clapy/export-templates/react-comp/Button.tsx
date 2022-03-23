import classes from './Button.module.css';

export default function Button() {
  return (
    <button className={classes.root}>
      <div className={classes.buttonBase}>Sign up</div>
    </button>
  );
}
