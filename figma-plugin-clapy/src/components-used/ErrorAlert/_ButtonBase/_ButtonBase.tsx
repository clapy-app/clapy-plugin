import type { FC, ReactNode } from 'react';
import { memo } from 'react';

import classes from './_ButtonBase.module.css';

interface Props {
  // Like PropsWithChildren<...>
  children?: ReactNode;
  icon: React.ReactElement;
}

export const _ButtonBase: FC<Props> = memo(function _ButtonBase(props) {
  const { icon, children } = props;
  return (
    <div className={classes.root}>
      {icon}
      <div className={classes.text}>{children}</div>
    </div>
  );
});
