import type { FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';

import { selectUserMetadata } from '../../../../user/user-slice.js';
import classes from './_BadgeBase2.module.css';

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

export const BadgeQuota: FC<Props> = memo(function BadgeQuotas(props = {}) {
  const { licenceExpirationDate } = useSelector(selectUserMetadata);
  let daysLeftTillRenewal;
  if (licenceExpirationDate) {
    let difference = new Date(licenceExpirationDate * 1000).getTime() - new Date().getTime();
    daysLeftTillRenewal = Math.ceil(difference / (1000 * 3600 * 24));
  }

  return (
    <div
      className={`${classes.root} ${props.className || ''} ${calcColor(licenceExpirationDate, daysLeftTillRenewal)}`}
    >
      <div className={`${classes.text} ${props.classes?.text || ''}`}>
        {daysLeftTillRenewal ? `Next billing in ${daysLeftTillRenewal} days` : ''}
      </div>
    </div>
  );
});
