import { ButtonHTMLAttributes, FC, memo } from 'react';
import { _ButtonBase_3 } from '../_ButtonBase_3/_ButtonBase_3';
import classes from './SignUpButton.module.css';

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export const SignUpButton: FC<Props> = memo(function BackToCodeGen(props) {
  return (
    <button className={classes.root} {...props}>
      <_ButtonBase_3 />
    </button>
  );
});
