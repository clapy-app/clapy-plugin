import classes from './_TabButtonBase.module.css';

export function _TabButtonBase() {
  return (
    <button className={classes.root}>
      <div className={classes.content}>
        <div className={classes.text}>Figma to code</div>
      </div>
      <div className={classes.bottomBorder}></div>
    </button>
  );
}
