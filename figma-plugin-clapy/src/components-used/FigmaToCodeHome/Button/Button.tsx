import { ButtonHTMLAttributes, FC, memo } from 'react';

import { _ButtonBase } from '../_ButtonBase/_ButtonBase';
import classes from './Button.module.css';

// interface Props {
//   onClick?: DOMAttributes<HTMLButtonElement>['onClick'];
// }

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  disabled?: boolean;
  loading?: boolean;
  variant?: 'text';
  size?: 'medium';
};

export const Button: FC<Props> = memo(function Button(props) {
  const { disabled, loading, ...buttonProps } = props;
  return (
    <button className={classes.root} disabled={disabled} {...buttonProps}>
      <_ButtonBase {...props} />
    </button>
  );
});
