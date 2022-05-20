import { FC, memo } from 'react';

import classes from './_InputFieldBase2.module.css';

interface Props {
  className?: string;
  classes?: {
    inputWithLabel?: string;
    input?: string;
    content?: string;
    text?: string;
  };
}
export const _InputFieldBase2: FC<Props> = memo(function _InputFieldBase2(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <div className={`${classes.inputWithLabel} ${props.classes?.inputWithLabel || ''}`}>
        <div className={`${classes.input} ${props.classes?.input || ''}`}>
          <div className={`${classes.content} ${props.classes?.content || ''}`}>
            <div className={`${classes.text} ${props.classes?.text || ''}`}>Company name</div>
          </div>
        </div>
      </div>
    </div>
  );
});
