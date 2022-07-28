import type { FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';

import { selectIsFreeUser } from '../../../../user/user-slice.js';
import classes from './_BadgeBase.module.css';

interface Props {
  className?: string;
  classes?: {
    text?: string;
  };
}
export const _BadgeBase: FC<Props> = memo(function _BadgeBase(props: Props) {
  const isFreeUser = useSelector(selectIsFreeUser);

  const bgColor = isFreeUser ? classes.root : classes.green;

  return (
    <div className={`${bgColor} ${props.className || ''}`}>
      <div className={`${classes.text} ${props.classes?.text || ''}`}>{isFreeUser ? 'Free' : 'Paid'} plan</div>
    </div>
  );
});
