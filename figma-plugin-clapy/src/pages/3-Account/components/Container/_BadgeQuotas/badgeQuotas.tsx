import type { FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';

import { selectUserQuota } from '../../../../user/user-slice.js';
import classes from './BadgeQuotas.module.css';

interface Props {
  className?: string;
  classes?: {
    clock?: string;
    text?: string;
  };
}

function calcColor(quota: number | undefined) {
  if (quota !== 0 && quota === undefined) {
    return '';
  }
  const isCloseToQuota = quota < 3 ? classes.yellow : classes.red;
  return quota < 2 ? classes.green : isCloseToQuota;
}

export const BadgeQuotas: FC<Props> = memo(function BadgeQuotas(props = {}) {
  const quota = useSelector(selectUserQuota);
  return (
    <div className={`${classes.root} ${props.className || ''} ${calcColor(quota)}`}>
      <div className={`${classes.text} ${props.classes?.text || ''}`}>
        <p> {`Code generation quota: ${quota} / 3`}</p>
      </div>
    </div>
  );
});
