import { memo } from 'react';
import type { FC } from 'react';

import classes from './SelectionPreview_StateState5.module.css';

interface Props {
  className?: string;
  classes?: {
    image2?: string;
    root?: string;
  };
}
/* @figmaId 377:97035 */
export const SelectionPreview_StateState5: FC<Props> = memo(function SelectionPreview_StateState5(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={`${classes.image2} ${props.classes?.image2 || ''}`}></div>
    </div>
  );
});
