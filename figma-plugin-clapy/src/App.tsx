import { FC, memo, useEffect } from 'react';

import classes from './App.module.scss';
import { handleError } from './common/error-utils';
import { getDuration } from './common/general-utils';
import { Layout } from './components-old/Layout/Layout';
import { track } from './features/1-import-sb/detail/analytics';
import { getTokens } from './features/auth/auth-service';

const openPluginTime = performance.now();

// Ideally, we should use document.addEventListener('visibilitychange', ...) but it doesn't work and triggers with alt+tab (undesired).
window.addEventListener('unload', function () {
  const durationInS = getDuration(openPluginTime, performance.now());
  track('close-plugin', undefined, { durationInS });
});

export const App: FC = memo(function App() {
  useEffect(() => {
    getTokens()
      .then(() => {
        track('open-plugin');
        // setError(undefined);
      })
      .catch(err => {
        handleError(err);
        // setError(err?.message || 'Unknown error');
      });
  }, []);

  return (
    <div className={classes.root}>
      <Layout />
    </div>
  );
  // return (
  //   <div className={styles.container}>
  //     <div className={styles.body}>
  //       <ImportSb />
  //     </div>
  //     <div className={styles.footer}>
  //       <a
  //         href='https://clapy.co?utm_source=plugin&utm_medium=contact&utm_campaign=plugin'
  //         target='_blank'
  //         rel='noreferrer'
  //       >
  //         clapy.co
  //       </a>
  //       <a href='https://bit.ly/clapy-discord-footer' target='_blank' rel='noreferrer'>
  //         Discord
  //       </a>
  //       {/* Mail link generated with https://mailtolink.me/ */}
  //       <a
  //         href='mailto:support@clapy.co?subject=Hello%20to%20Clapy%20team&body=Hey%20Clapy%20team%2C%0D%0A%0D%0AI%20am%20using%20your%20plugin%20and%20wanted%20to%20contact%20you.%0D%0A%0D%0AXXX'
  //         target='_blank'
  //         rel='noreferrer'
  //       >
  //         Contact us
  //       </a>
  //       <LogoutBtn />
  //     </div>
  //   </div>
  // );
});
