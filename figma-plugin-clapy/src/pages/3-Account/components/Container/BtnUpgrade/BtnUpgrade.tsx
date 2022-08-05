import { memo } from 'react';
import type { FC } from 'react';

import { ArrowUpCircleIcon } from './ArrowUpCircleIcon';
import classes from './BtnUpgrade.module.css';
import { _ButtonBase_SizeLgIconLeading } from './components/_ButtonBase_SizeLgIconLeading/_ButtonBase_SizeLgIconLeading';
import { ArrowUpCircle } from './components/ArrowUpCircle/ArrowUpCircle';

interface Props {
  className?: string;
}
export const BtnUpgrade: FC<Props> = memo(function BtnUpgrade(props = {}) {
  return (
    <div className={classes.root}>
      <_ButtonBase_SizeLgIconLeading
        className={classes._ButtonBase}
        swap={{
          circle: (
            <ArrowUpCircle
              className={classes.arrowUpCircle}
              swap={{
                icon: <ArrowUpCircleIcon className={classes.icon} />,
              }}
            />
          ),
        }}
        text={{
          text: <div className={classes.text}>Upgrade</div>,
        }}
      />
    </div>
  );
});
