import type { AnchorHTMLAttributes, ButtonHTMLAttributes, FC } from 'react';
import { memo } from 'react';

import { Loading } from '../../../../components-used/Loading/Loading';
import classes from './_ButtonBase.module.css';

type Props = (ButtonHTMLAttributes<HTMLButtonElement> | AnchorHTMLAttributes<HTMLAnchorElement>) & {
  disabled?: boolean;
  loading?: boolean;
  variant?: 'text';
  size?: 'medium';
};

export const _ButtonBase: FC<Props> = memo(function _ButtonBase(props) {
  const { disabled, loading, variant, size, children } = props;
  return (
    <div
      className={`${classes.root} ${disabled ? classes.disabled : ''} ${variant === 'text' ? classes.text : ''} ${
        size === 'medium' ? classes.medium : ''
      }`}
    >
      {loading && (
        <div className={classes.loading}>
          <Loading />
        </div>
      )}
      {!loading && <div className={classes.label}>{children}</div>}
    </div>
  );
});
