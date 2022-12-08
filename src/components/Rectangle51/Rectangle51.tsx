import { memo } from 'react';
import type { FC } from 'react';

import resets from '../_resets.module.css';
import classes from './Rectangle51.module.css';

interface Props {
  className?: string;
}
/* @figmaId 5268:270 */
export const Rectangle51: FC<Props> = memo(function Rectangle51(props = {}) {
  return <div className={`${resets.clapyResets} ${classes.root}`}></div>;
});
