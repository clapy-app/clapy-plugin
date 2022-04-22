import { ButtonHTMLAttributes, FC, memo } from 'react';
import classes from './_TabButtonBase.module.css';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export const _TabButtonBase: FC<Props> = memo(function _TabButtonBase(props) {
  const { active, children, ...buttonProps } = props;
  return (
    <button className={`${classes.root} ${active ? classes.active : ''}`} {...buttonProps}>
      <div className={classes.content}>
        <div className={classes.text}>{children}</div>
      </div>
      <div className={classes.bottomBorder}></div>
    </button>
  );
});
