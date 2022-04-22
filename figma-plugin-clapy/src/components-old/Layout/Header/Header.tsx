import { FC, memo, MouseEvent, useCallback } from 'react';
import { logout } from '../../../features/auth/auth-service';
import { HorizontalTabs } from '../HorizontalTabs/HorizontalTabs';
import classes from './Header.module.css';
import { LogOutIcon } from './LogOutIcon';

interface Props {
  activeTab: number;
  selectTab: (index: number, event: MouseEvent<HTMLButtonElement>) => void;
}

export const Header: FC<Props> = memo(function Header(props) {
  const { activeTab, selectTab } = props;
  const logoutBtn = useCallback(() => {
    logout();
  }, []);

  return (
    <div className={classes.root}>
      <HorizontalTabs activeTab={activeTab} selectTab={selectTab} />
      <button className={classes.button} onClick={logoutBtn}>
        <div className={classes._ButtonBase}>
          <LogOutIcon className={classes.logOut} />
        </div>
        <div className={classes.rectangle11}></div>
        <div className={classes.rectangle12}></div>
      </button>
    </div>
  );
});
