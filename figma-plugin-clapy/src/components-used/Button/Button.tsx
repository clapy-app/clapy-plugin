import type { AnchorHTMLAttributes, ButtonHTMLAttributes, FC } from 'react';
import { memo } from 'react';

import { _ButtonBase } from '../../pages/2-export-code/FigmaToCodeHome/_ButtonBase/_ButtonBase';
import classes from './Button.module.css';

// interface Props {
//   onClick?: DOMAttributes<HTMLButtonElement>['onClick'];
// }

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  disabled?: boolean;
  loading?: boolean;
  variant?: 'text';
  size?: 'medium';
};
type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  disabled?: boolean;
  loading?: boolean;
  variant?: 'text';
  size?: 'medium';
  href: string;
  target?: string;
};

type Props = ButtonProps | AnchorProps;

export const Button: FC<Props> = memo(function Button(props) {
  if (isAnchorProps(props)) {
    const { href, target, ...buttonProps } = props;
    const { loading, className, ...otherWrapperProps } = buttonProps;
    return (
      <a href={href} target={target} className={`${classes.root} ${className}`} {...otherWrapperProps}>
        <_ButtonBase {...buttonProps} />
      </a>
    );
  } else {
    const { loading, className, ...buttonProps } = props;
    return (
      <button className={`${classes.root} ${className}`} {...buttonProps}>
        <_ButtonBase {...props} />
      </button>
    );
  }
});

function isAnchorProps(props: Props): props is AnchorProps {
  return !!(props as AnchorProps).href;
}
