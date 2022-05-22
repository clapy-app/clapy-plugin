import { FC, memo } from 'react';

import { Button } from './Button/Button';
import classes from './FillUserProfile.module.css';
import { Footer } from './Footer/Footer';
import { InputDropdown2 } from './InputDropdown2/InputDropdown2';
import { InputDropdown } from './InputDropdown/InputDropdown';
import { InputField2 } from './InputField2/InputField2';
import { InputField3 } from './InputField3/InputField3';
import { InputField } from './InputField/InputField';
import { ProgressStepsProgressTextWithL } from './ProgressStepsProgressTextWithL/ProgressStepsProgressTextWithL';

interface Props {
  className?: string;
  classes?: {
    container?: string;
    frame99?: string;
    headline?: string;
    welcomeToClapy?: string;
    letSSetUpYourAccount?: string;
    form?: string;
    frame91?: string;
    frame89?: string;
    frame94?: string;
    frame892?: string;
    frame98?: string;
    submitButton?: string;
  };
}
export const FillUserProfile: FC<Props> = memo(function FillUserProfile(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <div className={`${classes.container} ${props.classes?.container || ''}`}>
        <div className={`${classes.frame99} ${props.classes?.frame99 || ''}`}>
          <ProgressStepsProgressTextWithL />
          <div className={`${classes.headline} ${props.classes?.headline || ''}`}>
            <div className={`${classes.welcomeToClapy} ${props.classes?.welcomeToClapy || ''}`}>Welcome to Clapy!</div>
            <div className={`${classes.letSSetUpYourAccount} ${props.classes?.letSSetUpYourAccount || ''}`}>
              Let’s set up your account
            </div>
          </div>
          <div className={`${classes.form} ${props.classes?.form || ''}`}>
            <div className={`${classes.frame91} ${props.classes?.frame91 || ''}`}>
              <div className={`${classes.frame89} ${props.classes?.frame89 || ''}`}>
                <InputField />
                <InputField2 />
              </div>
            </div>
            <div className={`${classes.frame94} ${props.classes?.frame94 || ''}`}>
              <div className={`${classes.frame892} ${props.classes?.frame892 || ''}`}>
                <InputField3 />
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
