import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './Book.module.css';
import { BookIcon } from './BookIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    icon?: ReactNode;
  };
}
/* @figmaId 315:37496 */
export const Book: FC<Props> = memo(function Book(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.icon}>{props.swap?.icon || <BookIcon className={classes.icon2} />}</div>
    </div>
  );
});
