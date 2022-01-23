import { FC, memo } from 'react';
import styles from './App.module.scss';
import { Sample } from './feat/sample/Sample';

const samples = Object.entries({
  reactstrap: 'Reactstrap',
  vibe: "Monday Vibe",
}).map(([key, label]) => {
  <option key={key} value={key}>{label}</option>;
})

export const App: FC = memo(() => {
  return (
    <div className={styles.container}>
      {/* <iframe id="inlineFrameExample"
        title="Inline Frame Example"
        width="300"
        height="200"
        srcDoc="https://www.openstreetmap.org/export/embed.html?bbox=-0.004017949104309083%2C51.47612752641776%2C0.00030577182769775396%2C51.478569861898606&layer=mapnik">
      </iframe> */}
      <select>
        {samples}
      </select>
      <Sample />
    </div>
  );
});
