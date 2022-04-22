import { FC, memo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { handleError } from '../../common/error-utils';
import { login } from '../../features/auth/auth-service';
import { selectAuthLoading } from '../../features/auth/auth-slice';
import { Button } from '../FigmaToCodeHome/Button/Button';
import { ClapyLogo2Icon } from './ClapyLogo2Icon';
import { Decoration } from './Decoration/Decoration';
import classes from './LoginHome.module.css';

export const LoginHome: FC = memo(function LoginHome() {
  const loginBtn = useCallback(
    () =>
      login().catch(err => {
        handleError(err);
        // setError(err?.message || 'Unknown error');
      }),
    [],
  );
  const authLoading = useSelector(selectAuthLoading);
  // const isSignedIn = useSelector(selectSignedIn);
  return (
    <div className={classes.content}>
      <div className={classes.logoBeta}>
        <div>
          <ClapyLogo2Icon className={classes.clapyLogo2} />
        </div>
        <div className={classes.betaBadge}>
          <div className={classes.frame52}>
            <div className={classes.beta}>beta</div>
          </div>
        </div>
      </div>
      <div className={classes.content2}>
        <Decoration />
        <div className={classes.paragraph}>
          <div className={classes.signInToClapy}>Sign in to Clapy</div>
          <div className={classes.generateCleanCodeFromFigmaInst}>
            Generate clean code from Figma instantly (React, HTML, CSS).
          </div>
        </div>
        {/* <div className={classes.signInRow}> */}
        <Button loading={authLoading} disabled={authLoading} onClick={loginBtn}>
          Sign in (Beta)
        </Button>
        {/* <SignInButton /> */}
        {/* <RequestAccessButton /> */}
        {/* </div> */}
      </div>
    </div>
  );
});
