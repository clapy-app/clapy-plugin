import { FC, memo } from 'react';
import classes from './_ButtonBase.module.css';

interface Props {
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
