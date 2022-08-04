import { memo } from 'react';
import type { FC } from 'react';

import classes from './BtnHistoryExportDisabled.module.css';
import { ClockIcon } from './ClockIcon';
import { Button_SizeLgHierarchySecondar } from './components/Button_SizeLgHierarchySecondar/Button_SizeLgHierarchySecondar';
import { Clock } from './components/Clock/Clock';

interface Props {
  className?: string;
}
export const BtnHistoryExportDisabled: FC<Props> = memo(function BtnHistoryExportDisabled(props = {}) {
  return (
    <div className={classes.root}>
      <Button_SizeLgHierarchySecondar
        className={classes.buttonUpgrade}
        classes={{ _ButtonBase: classes._ButtonBase }}
        swap={{
          circle: (
            <Clock
              className={classes.clock}
              swap={{
                icon: <ClockIcon className={classes.icon} />,
              }}
            />
          ),
        }}
        text={{
          text: <div className={classes.text}>Exports history (coming soon)</div>,
        }}
      />
    </div>
  );
});
