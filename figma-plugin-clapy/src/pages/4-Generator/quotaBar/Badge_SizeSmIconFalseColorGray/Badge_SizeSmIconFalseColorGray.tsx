import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { _BadgeBase_IconFalse2 } from '../_BadgeBase_IconFalse2/_BadgeBase_IconFalse2';
import classes from './Badge_SizeSmIconFalseColorGray.module.css';

interface Props {
  className?: string;
  text?: {
    text?: ReactNode;
  };
}
/* @figmaId 1868:108435 */
export const Badge_SizeSmIconFalseColorGray: FC<Props> = memo(function Badge_SizeSmIconFalseColorGray(props = {}) {
  return (
    <div>
      <_BadgeBase_IconFalse2
        className={classes._BadgeBase}
        text={{
          text: props.text?.text || <div className={classes.text}>Label</div>,
        }}
      />
    </div>
  );
});
