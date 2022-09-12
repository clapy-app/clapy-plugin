import type { FC } from 'react';
import { useRef, memo, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { login, signup } from '../../../core/auth/auth-service';
import { selectAuthLoading } from '../../../core/auth/auth-slice';
import { useCallbackAsync } from '../../../front-utils/front-utils.js';
import { AbortableButton } from '../../2-export-code/github/components/AbortableButton.js';
import { ClapyLogo2Icon } from './ClapyLogo2Icon/ClapyLogo2Icon';
import { Decoration } from './Decoration/Decoration';
import classes from './LoginHome.module.css';

export const LoginHome: FC = memo(function LoginHome() {
  const abortControllerRef = useRef<AbortController>();
  const loginBtn = useCallbackAsync(async () => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    try {
      await login(false, { abortController });
    } finally {
      abortControllerRef.current = undefined;
    }
  }, []);
  const signupBtn = useCallbackAsync(async () => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    try {
      await signup();
    } finally {
      abortControllerRef.current = undefined;
    }
  }, []);
  const cancel = useCallback(() => abortControllerRef.current?.abort(), []);

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
          <AbortableButton
            loading={authLoading}
            disabled={authLoading}
            onClick={signupBtn}
            onCancel={cancel}
            size='medium'
          >
            Sign up
          </AbortableButton>
          {!authLoading && (
            <AbortableButton
              loading={authLoading}
              disabled={authLoading}
              onClick={loginBtn}
              onCancel={cancel}
              variant='text'
              size='medium'
            >
              Already have an account? Sign in.
            </AbortableButton>
          )}
        </div>
      </div>
    </div>
  );
});
