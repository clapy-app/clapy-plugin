import type { FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';

import { selectIncreasedQuotaUser } from '../../../../../core/auth/auth-slice.js';
import { selectUserMaxQuota, selectUserQuota } from '../../../../user/user-slice.js';
import classes from './BadgeQuotas.module.css';

interface Props {
  className?: string;
  classes?: {
    clock?: string;
    text?: string;
  };
}

function calcColor(quota: number | undefined, quotaMax: number | undefined, isQualified: boolean | undefined) {
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

export const BadgeQuotas: FC<Props> = memo(function BadgeQuotas(props = {}) {
  const quota = useSelector(selectUserQuota);
  const quotaMax = useSelector(selectUserMaxQuota);

  const isQualifiedUser = useSelector(selectIncreasedQuotaUser);

  return (
    <div className={`${classes.root} ${props.className || ''} ${calcColor(quota, quotaMax, isQualifiedUser)}`}>
      <div className={`${classes.text} ${props.classes?.text || ''}`}>
        <p> {`Code generation quota: ${quota} / ${quotaMax}`}</p>
      </div>
    </div>
  );
});
