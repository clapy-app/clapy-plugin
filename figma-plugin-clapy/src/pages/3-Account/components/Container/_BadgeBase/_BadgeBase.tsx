import { FC, memo } from 'react';

import classes from './_BadgeBase.module.css';

interface Props {
  className?: string;
  classes?: {
    text?: string;
  };
}
export const _BadgeBase: FC<Props> = memo(function _BadgeBase(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <div className={`${classes.text} ${props.classes?.text || ''}`}>Free plan</div>
    </div>
  );
});
