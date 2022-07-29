import type { FC } from 'react';
import { memo, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { Button } from '../../../components-used/Button/Button';
import { login, signup } from '../../../core/auth/auth-service';
import { selectAuthLoading } from '../../../core/auth/auth-slice';
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
      </div>
      <div className={classes.content2}>
        <Decoration />
        <div className={classes.paragraph}>
          <div className={classes.signInToClapy}>Ready to code?</div>
          <p className={classes.generateCleanCodeFromFigmaInst}>
            Generate clean code from Figma instantly.{' '}
            <a href='https://bit.ly/docs-link-login' className={classes.docLink} target={'_blank'} rel='noreferrer'>
              Read our start guide.
            </a>
          </p>
        </div>
        <div className={classes.buttonsWrapper}>
          <Button loading={authLoading} disabled={authLoading} onClick={signupBtn} size='medium'>
            Sign up
          </Button>
          {!authLoading && (
            <Button loading={authLoading} disabled={authLoading} onClick={loginBtn} variant='text' size='medium'>
              Already have an account? Sign in.
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
