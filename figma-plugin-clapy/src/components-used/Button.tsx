import React, { FC } from 'react';

import styles from './Button.module.scss';

interface ComponentProps {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  secondary?: boolean;
  disabled?: boolean;
}

export const Button: FC<ComponentProps> = ({ onClick, children, secondary = false, disabled }) => {
  const buttonType = secondary ? styles.secondary : styles.primary;

  return (
    <button onClick={onClick} className={`${styles.base} ${buttonType}`} disabled={disabled}>
      {children}
    </button>
  );
};
