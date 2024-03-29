import Button from '@mui/material/Button';
import type { FC } from 'react';
import { memo } from 'react';

import classes from '../1-ImportSb.module.css';
import { fetchPlugin } from '../../../common/plugin-utils';
import { env } from '../../../environment/env';
import { parseErrorForDisplay, useCallbackAsync2 } from '../../../front-utils/front-utils';

export interface ErrorCompProps {
  error: any;
}

export const ErrorComp: FC<ErrorCompProps> = memo(function ErrorComp({ error }) {
  const isInterrupted = error === 'Interrupted';

  const reloadPlugin = useCallbackAsync2(async () => {
    if (env.isDev && !env.isFigmaPlugin) {
      window.location.reload();
    } else {
      await fetchPlugin('reloadUI');
    }
  }, []);

  if (!error) return null;
  if (isInterrupted) {
    return (
      <div>
        <em>{error}</em>
      </div>
    );
  }

  const { emailLink, errorMsgDisplayed } = parseErrorForDisplay(error);

  return (
    <div className={classes.errorWrapper}>
      <p className={classes.buttonWrapper}>
        <Button href={emailLink} target='_blank' rel='noopener noreferrer'>
          Report bug
        </Button>
        <Button onClick={reloadPlugin}>Reload plugin</Button>
      </p>
      <p>
        Unfortunately, this error prevents the plugin from displaying as it should. You can try to reopen the plugin. In
        some cases, it can unblock.
      </p>
      <p className={classes.errorWrapper2}>
        <em>{errorMsgDisplayed}</em>
      </p>
      <hr />
      <div>
        <img
          src='https://st.depositphotos.com/1794049/1359/i/450/depositphotos_13599623-stock-photo-bad-parking.jpg'
          alt=''
        />
      </div>
    </div>
  );
});
