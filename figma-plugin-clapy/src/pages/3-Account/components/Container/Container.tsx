import type { FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';

import { selectIsPaidUser } from '../../../../core/auth/auth-slice.js';
import { selectUserMetadata } from '../../../user/user-slice.js';
import { AvatarProfilePhoto } from './AvatarProfilePhoto/AvatarProfilePhoto';
import { Badge2 } from './Badge2/Badge2';
import { Badge } from './Badge/Badge';
import { ButtonContact } from './ButtonContact/ButtonContact.js';
import { ButtonUpgrade2 } from './ButtonUpgrade2/ButtonUpgrade2';
import { ButtonUpgrade } from './ButtonUpgrade/ButtonUpgrade';
import { ButtonViewPlan } from './buttonViewPlan/ButtonViewPlan.js';
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
  const { firstName, lastName, email, picture, quotas } = useSelector(selectUserMetadata);
  const isPaid = useSelector(selectIsPaidUser);
  console.log(quotas);
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <div className={`${classes.imageWrapOuter} ${props.classes?.imageWrapOuter || ''}`}>
        <div className={`${classes.imageWrapInner} ${props.classes?.imageWrapInner || ''}`}>
          <div className={`${classes.image} ${props.classes?.image || ''}`}></div>
        </div>
      </div>
      <div className={`${classes.settingsContainer} ${props.classes?.settingsContainer || ''}`}>
        <div className={`${classes.userMetadata} ${props.classes?.userMetadata || ''}`}>
          <AvatarProfilePhoto picture={picture} />
          <div className={`${classes.textAndSupportingText} ${props.classes?.textAndSupportingText || ''}`}>
            <div className={`${classes.frame136} ${props.classes?.frame136 || ''}`}>
              <div className={`${classes.textAndOnlineIndicator} ${props.classes?.textAndOnlineIndicator || ''}`}>
                <div className={`${classes.text} ${props.classes?.text || ''}`}>{firstName + ' ' + lastName}</div>
                <Dropdown />
              </div>
              <div className={`${classes.supportingText} ${props.classes?.supportingText || ''}`}>{email}</div>
            </div>
            <div className={`${classes.badges} ${props.classes?.badges || ''}`}>
              <div className={`${classes.row} ${props.classes?.row || ''}`}>
                <Badge />
                {isPaid && <Badge2 />}
              </div>
            </div>
          </div>
        </div>
        <div className={`${classes.actions} ${props.classes?.actions || ''}`}>
          {!isPaid && (
            <>
              <ButtonUpgrade />
              <ButtonUpgrade2 />
            </>
          )}
          {isPaid && (
            <>
              <ButtonViewPlan />
              <ButtonContact />
            </>
          )}
        </div>
      </div>
    </div>
  );
});
