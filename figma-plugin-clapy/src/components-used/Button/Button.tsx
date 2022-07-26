import type { ButtonHTMLAttributes, FC } from 'react';
import { memo } from 'react';

import { _ButtonBase } from '../../pages/2-export-code/FigmaToCodeHome/_ButtonBase/_ButtonBase';
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
  const { disabled, loading, className, ...buttonProps } = props;
  return (
    <button className={`${classes.root} ${className}`} disabled={disabled} {...buttonProps}>
      <_ButtonBase {...props} />
    </button>
  );
});
