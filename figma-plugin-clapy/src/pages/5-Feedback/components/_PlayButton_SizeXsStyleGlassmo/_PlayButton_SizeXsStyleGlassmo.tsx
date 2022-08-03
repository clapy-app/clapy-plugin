import { memo } from 'react';
import type { FC } from 'react';

import classes from './_PlayButton_SizeXsStyleGlassmo.module.css';
import { ButtonIcon } from './ButtonIcon';

interface Props {
  className?: string;
}
/* @figmaId 27:16882 */
export const _PlayButton_SizeXsStyleGlassmo: FC<Props> = memo(function _PlayButton_SizeXsStyleGlassmo(props = {}) {
  return (
    <button className={classes.root}>
      <div className={classes.button}>
        <ButtonIcon className={classes.icon} />
      </div>
    </button>
  );
});
