import { FC, memo } from 'react';

import { Button } from './Button/Button';
import { Footer } from './Footer/Footer';
import { InputDropdown2 } from './InputDropdown2/InputDropdown2';
import { InputDropdown } from './InputDropdown/InputDropdown';
import { InputField2 } from './InputField2/InputField2';
import { InputField } from './InputField/InputField';
import classes from './LoggingIn.module.css';
import { ProgressStepsProgressTextWithL } from './ProgressStepsProgressTextWithL/ProgressStepsProgressTextWithL';

interface Props {
  className?: string;
  classes?: {
    container?: string;
    frame99?: string;
    headline?: string;
    helloFirstname?: string;
    letSSetUpYourClapyAccount?: string;
    form?: string;
    frame94?: string;
    frame89?: string;
    frame95?: string;
    frame892?: string;
    frame98?: string;
    submitButton?: string;
  };
}
export const LoggingIn: FC<Props> = memo(function LoggingIn(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <div className={`${classes.container} ${props.classes?.container || ''}`}>
        <div className={`${classes.frame99} ${props.classes?.frame99 || ''}`}>
          <ProgressStepsProgressTextWithL />
          <div className={`${classes.headline} ${props.classes?.headline || ''}`}>
            <div className={`${classes.helloFirstname} ${props.classes?.helloFirstname || ''}`}>
              Hello &#123;firstname&#125;!
            </div>
            <div className={`${classes.letSSetUpYourClapyAccount} ${props.classes?.letSSetUpYourClapyAccount || ''}`}>
              Let’s set up your Clapy account
            </div>
          </div>
          <div className={`${classes.form} ${props.classes?.form || ''}`}>
            <div className={`${classes.frame94} ${props.classes?.frame94 || ''}`}>
              <div className={`${classes.frame89} ${props.classes?.frame89 || ''}`}>
                <InputField />
              </div>
            </div>
            <div className={`${classes.frame95} ${props.classes?.frame95 || ''}`}>
              <div className={`${classes.frame892} ${props.classes?.frame892 || ''}`}>
                <InputField2 />
              </div>
            </div>
            <InputDropdown />
            <InputDropdown2 />
          </div>
          <div className={`${classes.frame98} ${props.classes?.frame98 || ''}`}>
            <div className={`${classes.submitButton} ${props.classes?.submitButton || ''}`}>
              <Button />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
});
