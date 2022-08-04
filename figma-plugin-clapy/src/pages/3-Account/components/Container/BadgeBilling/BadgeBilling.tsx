import type { FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';

import { selectIsFreeUser, selectUserMaxQuota, selectUserQuota } from '../../../../user/user-slice.js';
import classes from './BadgeBilling.module.css';

interface Props {
  className?: string;
  classes?: {
    clock?: string;
    text?: string;
  };
}

function calcColor(
  quota: number | undefined,
  quotaMax: number | undefined,
  isQualified: boolean | undefined,
  isFreeUser: boolean,
) {
  if (!isFreeUser) return classes.green;
  if ((quota !== 0 && quota === undefined) || (quotaMax !== 0 && quotaMax === undefined)) {
    return '';
  }
  const threeQuartersOfMax = Math.floor((quotaMax * 3) / 4);
  if (isQualified) {
    const isCloseToQuota = quota < quotaMax ? classes.yellow : classes.red;
    return quota < threeQuartersOfMax ? classes.green : isCloseToQuota;
  } else {
    const isCloseToQuota = quota < quotaMax ? classes.yellow : classes.red;
    return quota < threeQuartersOfMax ? classes.green : isCloseToQuota;
  }
}

export const BadgeBilling: FC<Props> = memo(function BadgeBilling(props = {}) {
  const quota = useSelector(selectUserQuota);
  const quotaMax = useSelector(selectUserMaxQuota);
  const isFreeUser = useSelector(selectIsFreeUser);

  return isFreeUser ? (
    <div className={`${classes.free}`}>
      <div className={`${classes.text} ${props.classes?.text || ''}`}>
        <p> {`${quota} / ${quotaMax} exports`}</p>
      </div>
    </div>
  ) : (
    <>
      <div className={`${classes.free}`}>
        <div className={`${classes.text} ${props.classes?.text || ''}`}>
          <p> Billing: monthly</p>
        </div>
      </div>
    </>
  );
});
