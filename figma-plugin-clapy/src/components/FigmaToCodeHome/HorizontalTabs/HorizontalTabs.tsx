import { _TabButtonBase } from '../_TabButtonBase/_TabButtonBase';
import { _TabButtonBase_2 } from '../_TabButtonBase_2/_TabButtonBase_2';
import classes from './HorizontalTabs.module.css';

export function HorizontalTabs() {
  return (
    <div className={classes.root}>
      <div className={classes.divider}></div>
      <div className={classes.tabs}>
        <_TabButtonBase />
        <_TabButtonBase_2 />
      </div>
    </div>
  );
}
