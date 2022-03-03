import { FC, memo } from 'react';

import styles from './App.module.scss';
import { ImportSb } from './feat/import-sb/1-ImportSb';

export const App: FC = memo(function App() {
  return (
    <div className={styles.container}>
      <ImportSb />
      {/* <Sample /> */}
    </div>
  );
});
