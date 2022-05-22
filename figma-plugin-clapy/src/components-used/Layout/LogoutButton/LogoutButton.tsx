import { FC, memo, useCallback } from 'react';

import { logout } from '../../../core/auth/auth-service';
import classes from './LogoutButton.module.css';
import { LogOutIcon } from './LogOutIcon';

interface Props {
  absolute?: boolean;
}

export const LogoutButton: FC<Props> = memo(function LogoutButton({ absolute }) {
  const logoutBtn = useCallback(() => {
    logout();
  }, []);

  return (
    <button className={`${classes.button} ${absolute ? classes.absolute : ''}`} onClick={logoutBtn}>
      <div className={classes._ButtonBase}>
        <LogOutIcon className={classes.logOut} />
      </div>
      <div className={classes.rectangle11}></div>
      <div className={classes.rectangle12}></div>
    </button>
  );
});
