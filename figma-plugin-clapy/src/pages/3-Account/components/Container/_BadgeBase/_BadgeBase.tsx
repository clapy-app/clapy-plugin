import type { FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';

import { selectIsPaidUser } from '../../../../user/user-slice.js';
import classes from './_BadgeBase.module.css';

interface Props {
  className?: string;
  classes?: {
    text?: string;
  };
}
export const _BadgeBase: FC<Props> = memo(function _BadgeBase(props: Props) {
  const isNotPaid = useSelector(selectIsPaidUser);

  const bgColor = isNotPaid ? classes.root : classes.green;

  return (
    <div className={`${bgColor} ${props.className || ''}`}>
      <div className={`${classes.text} ${props.classes?.text || ''}`}>{isNotPaid ? 'Free' : 'Paid'} plan</div>
    </div>
  );
});
