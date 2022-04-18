import { HorizontalTabs } from '../HorizontalTabs/HorizontalTabs';
import classes from './Header.module.css';
import { LogOutIcon } from './LogOutIcon';

export function Header() {
  return (
    <div className={classes.root}>
      <HorizontalTabs />
      <button className={classes.button}>
        <div className={classes._ButtonBase}>
          <LogOutIcon className={classes.logOut} />
        </div>
        <div className={classes.rectangle11}></div>
        <div className={classes.rectangle12}></div>
      </button>
    </div>
  );
}
