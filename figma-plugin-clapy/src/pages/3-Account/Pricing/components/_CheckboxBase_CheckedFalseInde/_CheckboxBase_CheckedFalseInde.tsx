import { memo } from 'react';
import type { FC } from 'react';

import classes from './_CheckboxBase_CheckedFalseInde.module.css';

interface Props {
  className?: string;
}
/* @figmaId 1899:112331 */
export const _CheckboxBase_CheckedFalseInde: FC<Props> = memo(function _CheckboxBase_CheckedFalseInde(props = {}) {
  return <input className={classes.root} type='checkbox'></input>;
});
