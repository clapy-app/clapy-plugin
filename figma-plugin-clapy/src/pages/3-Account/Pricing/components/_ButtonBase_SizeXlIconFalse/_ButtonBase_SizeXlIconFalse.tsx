import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './_ButtonBase_SizeXlIconFalse.module.css';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  text?: {
    text?: ReactNode;
  };
}
/* @figmaId 10:7381 */
export const _ButtonBase_SizeXlIconFalse: FC<Props> = memo(function _ButtonBase_SizeXlIconFalse(props = {}) {
  return <div>{props.text?.text != null ? props.text?.text : <div className={classes.text}>Button CTA</div>}</div>;
});
