import { FC, memo, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { login, signup } from '../../core/auth/auth-service';
import { selectAuthLoading } from '../../core/auth/auth-slice';
import { Button } from '../FigmaToCodeHome/Button/Button';
import { ClapyLogo2Icon } from './ClapyLogo2Icon';
import { Decoration } from './Decoration/Decoration';
import classes from './LoginHome.module.css';

export const LoginHome: FC = memo(function LoginHome() {
  const loginBtn = useCallback(() => login(), []);
  const signupBtn = useCallback(() => signup(), []);
  const authLoading = useSelector(selectAuthLoading);
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
        <div className={classes.buttonsWrapper}>
          <Button loading={authLoading} disabled={authLoading} onClick={loginBtn} size='medium'>
            Sign in
          </Button>
          <Button loading={authLoading} disabled={authLoading} onClick={signupBtn} variant='text' size='medium'>
            Don&apos;t have an account yet? Sign up.
          </Button>
        </div>
      </div>
    </div>
  );
});
