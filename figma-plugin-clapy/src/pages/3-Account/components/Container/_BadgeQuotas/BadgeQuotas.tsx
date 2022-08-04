import type { FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';

import { selectIsFreeUser, selectUserMaxQuota, selectUserQuota } from '../../../../user/user-slice.js';
import classes from './BadgeQuotas.module.css';

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

export const BadgeQuotas: FC<Props> = memo(function BadgeQuotas(props = {}) {
  const quota = useSelector(selectUserQuota);
  const quotaMax = useSelector(selectUserMaxQuota);
  const isFreeUser = useSelector(selectIsFreeUser);

  return (
    <div className={``}>
      <div className={`${classes.text} ${props.classes?.text || ''}`}>
        {isFreeUser && <p> {`${quota} / ${quotaMax} exports`}</p>}
        {!isFreeUser && <p> {`${quota} components in library`}</p>}
      </div>
    </div>
  );
});
