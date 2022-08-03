import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { _BadgeBase_IconOnly } from '../_BadgeBase_IconOnly/_BadgeBase_IconOnly';
import classes from './Badge_SizeSmIconOnlyColorPrima.module.css';

interface Props {
  className?: string;
  swap?: {
    _BadgeBase?: ReactNode;
  };
}
/* @figmaId 1868:108452 */
export const Badge_SizeSmIconOnlyColorPrima: FC<Props> = memo(function Badge_SizeSmIconOnlyColorPrima(props = {}) {
  return <div>{props.swap?._BadgeBase || <_BadgeBase_IconOnly className={classes._BadgeBase} />}</div>;
});
