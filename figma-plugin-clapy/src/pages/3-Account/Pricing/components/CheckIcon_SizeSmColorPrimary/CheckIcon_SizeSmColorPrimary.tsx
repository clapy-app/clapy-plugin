import { memo } from 'react';
import type { FC } from 'react';

import classes from './CheckIcon_SizeSmColorPrimary.module.css';
import { SizeSmColorPrimaryIcon } from './SizeSmColorPrimaryIcon';

interface Props {
  className?: string;
}
/* @figmaId 315:43156 */
export const CheckIcon_SizeSmColorPrimary: FC<Props> = memo(function CheckIcon_SizeSmColorPrimary(props = {}) {
  return (
    <div className={classes.root}>
      <div className={classes.icon}>
        <SizeSmColorPrimaryIcon className={classes.icon2} />
      </div>
    </div>
  );
});
