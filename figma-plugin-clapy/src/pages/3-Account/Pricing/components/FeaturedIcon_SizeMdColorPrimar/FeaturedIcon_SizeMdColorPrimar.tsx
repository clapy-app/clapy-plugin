import { memo } from 'react';
import type { FC } from 'react';

import { Zap } from '../Zap/Zap';
import classes from './FeaturedIcon_SizeMdColorPrimar.module.css';
import { ZapIcon } from './ZapIcon';

interface Props {
  className?: string;
}
/* @figmaId 27:13061 */
export const FeaturedIcon_SizeMdColorPrimar: FC<Props> = memo(function FeaturedIcon_SizeMdColorPrimar(props = {}) {
  return (
    <div className={classes.root}>
      <Zap
        className={classes.zap}
        swap={{
          icon: <ZapIcon className={classes.icon} />,
        }}
      />
    </div>
  );
});
