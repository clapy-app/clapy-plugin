import { FC, memo } from 'react';
import styles from './App.module.scss';
import { ImportSb } from './feat/import-sb/ImportSb';
import { Sample } from './feat/sample/Sample';

export const App: FC = memo(() => {
  return (
    <div className={styles.container}>
      <ImportSb />
      <Sample />
    </div>
  );
});
