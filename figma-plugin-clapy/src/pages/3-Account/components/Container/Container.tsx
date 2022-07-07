import { FC, memo } from 'react';

import { AvatarProfilePhoto } from './AvatarProfilePhoto/AvatarProfilePhoto';
import { Badge2 } from './Badge2/Badge2';
import { Badge } from './Badge/Badge';
import { ButtonUpgrade2 } from './ButtonUpgrade2/ButtonUpgrade2';
import { ButtonUpgrade } from './ButtonUpgrade/ButtonUpgrade';
import classes from './Container.module.css';
import { Dropdown } from './Dropdown/Dropdown';

interface Props {
  className?: string;
  classes?: {
    imageWrapOuter?: string;
    imageWrapInner?: string;
    image?: string;
    settingsContainer?: string;
    userMetadata?: string;
    textAndSupportingText?: string;
    frame136?: string;
    textAndOnlineIndicator?: string;
    text?: string;
    supportingText?: string;
    badges?: string;
    row?: string;
    actions?: string;
  };
}
export const Container: FC<Props> = memo(function Container(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <div className={`${classes.imageWrapOuter} ${props.classes?.imageWrapOuter || ''}`}>
        <div className={`${classes.imageWrapInner} ${props.classes?.imageWrapInner || ''}`}>
          <div className={`${classes.image} ${props.classes?.image || ''}`}></div>
        </div>
      </div>
      <div className={`${classes.settingsContainer} ${props.classes?.settingsContainer || ''}`}>
        <div className={`${classes.userMetadata} ${props.classes?.userMetadata || ''}`}>
          <AvatarProfilePhoto />
          <div className={`${classes.textAndSupportingText} ${props.classes?.textAndSupportingText || ''}`}>
            <div className={`${classes.frame136} ${props.classes?.frame136 || ''}`}>
              <div className={`${classes.textAndOnlineIndicator} ${props.classes?.textAndOnlineIndicator || ''}`}>
                <div className={`${classes.text} ${props.classes?.text || ''}`}>Olivia Rhye</div>
                <Dropdown />
              </div>
              <div className={`${classes.supportingText} ${props.classes?.supportingText || ''}`}>
                olivia@untitledui.com
              </div>
            </div>
            <div className={`${classes.badges} ${props.classes?.badges || ''}`}>
              <div className={`${classes.row} ${props.classes?.row || ''}`}>
                <Badge />
                <Badge2 />
              </div>
            </div>
          </div>
        </div>
        <div className={`${classes.actions} ${props.classes?.actions || ''}`}>
          <ButtonUpgrade />
          <ButtonUpgrade2 />
        </div>
      </div>
    </div>
  );
});
