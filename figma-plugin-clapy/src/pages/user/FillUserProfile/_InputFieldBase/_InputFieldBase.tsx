import { FC, memo } from 'react';

import classes from './_InputFieldBase.module.css';

interface Props {
  className?: string;
  classes?: {
    inputWithLabel?: string;
    input?: string;
    content?: string;
    text?: string;
  };
}
export const _InputFieldBase: FC<Props> = memo(function _InputFieldBase(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <div className={`${classes.inputWithLabel} ${props.classes?.inputWithLabel || ''}`}>
        <div className={`${classes.input} ${props.classes?.input || ''}`}>
          <div className={`${classes.content} ${props.classes?.content || ''}`}>
            <div className={`${classes.text} ${props.classes?.text || ''}`}>First name*</div>
          </div>
        </div>
      </div>
    </div>
  );
});
