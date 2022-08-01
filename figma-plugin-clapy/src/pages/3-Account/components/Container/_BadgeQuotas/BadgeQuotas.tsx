import type { FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';

import { appConfig } from '../../../../../common/app-config.js';
import { selectIncreasedQuotaUser } from '../../../../../core/auth/auth-slice.js';
import { selectUserQuota } from '../../../../user/user-slice.js';
import classes from './BadgeQuotas.module.css';

interface Props {
  className?: string;
  classes?: {
    clock?: string;
    text?: string;
  };
}

function calcColor(quota: number | undefined, isQualified: boolean | undefined) {
  if (quota !== 0 && quota === undefined) {
    return '';
  }
  if (isQualified) {
    const isCloseToQuota = quota < 25 ? classes.yellow : classes.red;
    return quota < 15 ? classes.green : isCloseToQuota;
  } else {
    const isCloseToQuota = quota < 3 ? classes.yellow : classes.red;
    return quota < 2 ? classes.green : isCloseToQuota;
  }
}

export const BadgeQuotas: FC<Props> = memo(function BadgeQuotas(props = {}) {
  const quota = useSelector(selectUserQuota);
  const isQualifiedUser = useSelector(selectIncreasedQuotaUser);

  return (
    <div className={`${classes.root} ${props.className || ''} ${calcColor(quota, isQualifiedUser)}`}>
      <div className={`${classes.text} ${props.classes?.text || ''}`}>
        <p>
          {' '}
          {`Code generation quota: ${quota} / ${
            isQualifiedUser ? appConfig.codeGenQualifiedQuota : appConfig.codeGenFreeQuota
          }`}
        </p>
      </div>
    </div>
  );
});
