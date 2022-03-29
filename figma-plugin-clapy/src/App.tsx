import { FC, memo } from 'react';

import styles from './App.module.scss';
import { getDuration } from './common/general-utils';
import { ImportSb } from './features/1-import-sb/1-ImportSb';
import { track } from './features/1-import-sb/detail/analytics';
import { LogoutBtn } from './features/auth/LogoutBtn';

const openPluginTime = performance.now();

// Ideally, we should use document.addEventListener('visibilitychange', ...) but it doesn't work and triggers with alt+tab (undesired).
window.addEventListener('unload', function () {
  const durationInS = getDuration(openPluginTime, performance.now());
  track('close-plugin', undefined, { durationInS });
});

export const App: FC = memo(function App() {
  return (
    <div className={styles.container}>
      <div className={styles.body}>
        <ImportSb />
        {/* <Sample /> */}
      </div>
      <div className={styles.footer}>
        <a
          href='https://clapy.co?utm_source=plugin&utm_medium=contact&utm_campaign=plugin'
          target='_blank'
          rel='noreferrer'
        >
          clapy.co
        </a>
        <a href='https://bit.ly/clapy-discord-footer' target='_blank' rel='noreferrer'>
          Discord
        </a>
        <a href='https://bit.ly/clapy-slack-footer' target='_blank' rel='noreferrer'>
          Slack
        </a>
        {/* Mail link generated with https://mailtolink.me/ */}
        <a
          href='mailto:support@clapy.co?subject=Hello%20to%20Clapy%20team&body=Hey%20Clapy%20team%2C%0D%0A%0D%0AI%20am%20using%20your%20plugin%20and%20wanted%20to%20contact%20you.%0D%0A%0D%0AXXX'
          target='_blank'
          rel='noreferrer'
        >
          Contact us
        </a>
        <LogoutBtn />
      </div>
    </div>
  );
});
