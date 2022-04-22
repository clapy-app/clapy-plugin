import { ButtonHTMLAttributes, FC, memo } from 'react';
import classes from './_ButtonBase.module.css';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export const _ButtonBase: FC<Props> = memo(function _ButtonBase(props) {
  return (
    <div className={classes.root}>
      <div className={classes.text}>Sign in (Beta)</div>
    </div>
  );
});
