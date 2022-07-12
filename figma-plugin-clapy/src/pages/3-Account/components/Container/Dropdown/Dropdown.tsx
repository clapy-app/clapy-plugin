import { FC, memo } from 'react';

import classes from './Dropdown.module.css';
import { MoreHorizontalIcon } from './MoreHorizontalIcon';

interface Props {
  className?: string;
  classes?: {
    moreHorizontal?: string;
  };
}
export const Dropdown: FC<Props> = memo(function Dropdown(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <MoreHorizontalIcon className={`${classes.moreHorizontal} ${props.classes?.moreHorizontal || ''}`} />
    </div>
  );
});
