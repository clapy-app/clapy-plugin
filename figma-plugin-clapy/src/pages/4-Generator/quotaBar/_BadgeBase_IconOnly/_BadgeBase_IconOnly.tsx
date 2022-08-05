import { memo } from 'react';
import type { FC } from 'react';

import { Plus } from '../Plus/Plus';
import classes from './_BadgeBase_IconOnly.module.css';
import { PlusIcon } from './PlusIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
}
/* @figmaId 1868:108407 */
export const _BadgeBase_IconOnly: FC<Props> = memo(function _BadgeBase_IconOnly(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <Plus
        className={classes.plus}
        swap={{
          icon: <PlusIcon className={classes.icon} />,
        }}
      />
    </div>
  );
});
