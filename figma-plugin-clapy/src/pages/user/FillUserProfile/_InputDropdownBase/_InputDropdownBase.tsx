import { FC, memo } from 'react';

import classes from './_InputDropdownBase.module.css';
import { ChevronDownIcon } from './ChevronDownIcon';

interface Props {
  className?: string;
  classes?: {
    inputWithLabel?: string;
    input?: string;
    content?: string;
    text?: string;
    chevronDown?: string;
  };
}
export const _InputDropdownBase: FC<Props> = memo(function _InputDropdownBase(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <div className={`${classes.inputWithLabel} ${props.classes?.inputWithLabel || ''}`}>
        <div className={`${classes.input} ${props.classes?.input || ''}`}>
          <div className={`${classes.content} ${props.classes?.content || ''}`}>
            <div className={`${classes.text} ${props.classes?.text || ''}`}>Select your Job Title</div>
          </div>
          <ChevronDownIcon className={`${classes.chevronDown} ${props.classes?.chevronDown || ''}`} />
        </div>
      </div>
    </div>
  );
});
