import { FC, memo, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { logout } from './auth-service';
import { selectAuthLoading, selectSignedIn } from './auth-slice';
import classes from './LogoutBtn.module.scss';

export const LogoutBtn: FC = memo(function LogoutBtn() {
  const authLoading = useSelector(selectAuthLoading);
  const isSignedIn = useSelector(selectSignedIn);
  const logoutBtn = useCallback(() => {
    logout();
  }, []);

  if (!isSignedIn) return null;
  return (
    <button className={classes.textButton} onClick={logoutBtn}>
      Logout
    </button>
  );
});
