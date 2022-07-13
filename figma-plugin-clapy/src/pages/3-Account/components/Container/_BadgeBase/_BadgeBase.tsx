import type { FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';

import { selectIsPaidUser } from '../../../../../core/auth/auth-slice.js';
import classes from './_BadgeBase.module.css';

interface Props {
  className?: string;
  classes?: {
    text?: string;
  };
}
export const _BadgeBase: FC<Props> = memo(function _BadgeBase(props: Props) {
  const isPaid = useSelector(selectIsPaidUser);
  const bgColor = isPaid ? classes.green : classes.root;

  return (
    <div className={`${bgColor} ${props.className || ''}`}>
      <div className={`${classes.text} ${props.classes?.text || ''}`}>{isPaid ? 'Paid' : 'Free'} plan</div>
    </div>
  );
});
