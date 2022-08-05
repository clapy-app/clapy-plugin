import { memo } from 'react';
import type { FC } from 'react';

import { _ButtonBase_SizeXlIconFalse } from '../_ButtonBase_SizeXlIconFalse/_ButtonBase_SizeXlIconFalse';
import classes from './Button_SizeXlHierarchySecondar.module.css';

interface Props {
  className?: string;
}
/* @figmaId 10:8534 */
export const Button_SizeXlHierarchySecondar: FC<Props> = memo(function Button_SizeXlHierarchySecondar(props = {}) {
  return (
    <button className={classes.root}>
      <_ButtonBase_SizeXlIconFalse
        className={classes._ButtonBase}
        text={{
          text: <div className={classes.text}>Button CTA</div>,
        }}
      />
    </button>
  );
});
