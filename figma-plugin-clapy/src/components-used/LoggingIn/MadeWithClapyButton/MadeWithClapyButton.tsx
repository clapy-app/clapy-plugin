import { FC, memo } from 'react';

import { LogomarkIcon } from './LogomarkIcon';
import classes from './MadeWithClapyButton.module.css';

interface Props {
  className?: string;
  classes?: {
    _ButtonBase?: string;
    frame66?: string;
    text?: string;
    logomark?: string;
  };
}
export const MadeWithClapyButton: FC<Props> = memo(function MadeWithClapyButton(props = {}) {
  return (
    <button className={`${classes.root} ${props.className || ''}`}>
      <div className={`${classes._ButtonBase} ${props.classes?._ButtonBase || ''}`}>
        <div className={`${classes.frame66} ${props.classes?.frame66 || ''}`}>
          <div className={`${classes.text} ${props.classes?.text || ''}`}>UI made by</div>
        </div>
        <LogomarkIcon className={`${classes.logomark} ${props.classes?.logomark || ''}`} />
      </div>
    </button>
  );
});
