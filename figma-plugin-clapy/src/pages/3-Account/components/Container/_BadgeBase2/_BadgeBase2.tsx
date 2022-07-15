import type { FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';

import { selectUserMetadata } from '../../../../user/user-slice.js';
import classes from './_BadgeBase2.module.css';
import { ClockIcon } from './ClockIcon';

interface Props {
  className?: string;
  classes?: {
    clock?: string;
    text?: string;
  };
}

export const _BadgeBase2: FC<Props> = memo(function _BadgeBase2(props = {}) {
  const { licenceStartDate, licenceExpirationDate } = useSelector(selectUserMetadata);

  let daysLeftTillRenewal;
  const color = (licenceExpirationDate: number | undefined) => {
    if (licenceExpirationDate) {
      let difference = new Date(licenceExpirationDate * 1000).getTime() - new Date().getTime();
      daysLeftTillRenewal = Math.ceil(difference / (1000 * 3600 * 24));
      const isCloseToRenewal = daysLeftTillRenewal > 10 ? classes.yellow : classes.red;
      return daysLeftTillRenewal > 20 ? classes.green : isCloseToRenewal;
    }
  };

  return (
    <div className={`${classes.root} ${props.className || ''} ${color(licenceExpirationDate)}`}>
      <ClockIcon className={`${classes.clock} ${props.classes?.clock || ''}`} />
      <div className={`${classes.text} ${props.classes?.text || ''}`}>
        {daysLeftTillRenewal ? `Next billing in ${daysLeftTillRenewal} days` : ''}
      </div>
    </div>
  );
});
