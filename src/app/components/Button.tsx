import React, { FC } from 'react';
import styles from './Button.module.scss';


interface ComponentProps {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  secondary?: boolean;
}

const Button: FC<ComponentProps> = ({ onClick, children, secondary = false }) => {
  const buttonType = secondary ? styles.secondary : styles.primary;

  return (
    <button onClick={onClick} className={`${styles.base} ${buttonType}`}>
      {children}
    </button>
  );
};

export default Button;
