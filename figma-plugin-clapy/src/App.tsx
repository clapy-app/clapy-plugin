import { FC, memo } from 'react';

import styles from './App.module.scss';
import { LogoutBtn } from './feat/auth/LogoutBtn';
import { ImportSb } from './feat/import-sb/1-ImportSb';
import { track } from './feat/import-sb/detail/analytics';

// Ideally, we should use document.addEventListener('visibilitychange', ...) but it doesn't work and triggers with alt+tab (undesired).
window.addEventListener('unload', function () {
  track('close-plugin');
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
        <a
          href='https://join.slack.com/t/clapy-co/shared_invite/zt-14uz8kprq-MMtpwU5Wkpt7KuF0p72uiQ'
          target='_blank'
          rel='noreferrer'
        >
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
