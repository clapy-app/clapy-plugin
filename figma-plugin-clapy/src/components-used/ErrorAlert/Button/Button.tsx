import { AnchorHTMLAttributes, ButtonHTMLAttributes, FC, memo } from 'react';

import { _ButtonBase } from '../_ButtonBase/_ButtonBase';
import classes from './Button.module.css';

type AnchorProps = {
  icon: React.ReactElement;
  href: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;
type ButtonProps = {
  icon: React.ReactElement;
} & ButtonHTMLAttributes<HTMLButtonElement>;

type Props = AnchorProps | ButtonProps;

export const Button: FC<Props> = memo(function Button(props) {
  if (isAnchorProps(props)) {
    const { icon, href, children, ...buttonProps } = props;
    return (
      <a href={href} target='_blank' rel='noreferrer' className={classes.root} {...buttonProps}>
        <_ButtonBase icon={icon}>{children}</_ButtonBase>
      </a>
    );
  } else {
    const { icon, children, ...buttonProps } = props;
    return (
      <button className={classes.root} {...buttonProps}>
        <_ButtonBase icon={icon}>{children}</_ButtonBase>
      </button>
    );
  }
});

function isAnchorProps(props: Props): props is AnchorProps {
  return !!(props as AnchorProps).href;
}
