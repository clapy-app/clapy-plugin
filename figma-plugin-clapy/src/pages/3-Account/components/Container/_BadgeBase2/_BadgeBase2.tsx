import type { FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';

import { selectUserLicenceExpirationDate } from '../../../../../core/auth/auth-slice.js';
import classes from './_BadgeBase2.module.css';
import { ClockIcon } from './ClockIcon';

interface Props {
  className?: string;
  classes?: {
    clock?: string;
    text?: string;
  };
}

function calcColor(licenceExpirationDate: number | undefined, daysLeftTillRenewal: number | undefined) {
  if (!licenceExpirationDate || !daysLeftTillRenewal) {
    return '';
  }
  const isCloseToRenewal = daysLeftTillRenewal > 10 ? classes.yellow : classes.red;
  return daysLeftTillRenewal > 20 ? classes.green : isCloseToRenewal;
}

export const _BadgeBase2: FC<Props> = memo(function _BadgeBase2(props = {}) {
  const licenceExpirationDate = useSelector(selectUserLicenceExpirationDate);

  let daysLeftTillRenewal;
  if (licenceExpirationDate) {
    let difference = new Date(licenceExpirationDate * 1000).getTime() - new Date().getTime();
    daysLeftTillRenewal = Math.ceil(difference / (1000 * 3600 * 24));
  }

  return (
    <div
      className={`${classes.root} ${props.className || ''} ${calcColor(licenceExpirationDate, daysLeftTillRenewal)}`}
    >
      <ClockIcon className={`${classes.clock} ${props.classes?.clock || ''}`} />
      <div className={`${classes.text} ${props.classes?.text || ''}`}>
        {daysLeftTillRenewal ? `Next billing in ${daysLeftTillRenewal} days` : ''}
      </div>
    </div>
  );
});
