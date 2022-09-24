import Button from '@mui/material/Button/Button.js';
import Input from '@mui/material/Input/Input.js';
import TextField from '@mui/material/TextField/TextField.js';
import type { ChangeEvent, FC } from 'react';
import { memo, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';

import { renderFigmaConfig } from '../../../../admin/admin-service.js';
import type { FigmaConfigGenPayload } from '../../../../common/sb-serialize.model.js';
import { Loading } from '../../../../components-used/Loading/Loading.js';
import { selectDevTools, selectFreeStripeAccess } from '../../../../core/auth/auth-slice.js';
import { env } from '../../../../environment/env.js';
import { selectIsFreeUser, selectUserMetadata } from '../../../user/user-slice.js';
import { PaymentConfirmation } from '../../PaymentConfirmation/PaymentConfirmation';
import { selectPaymentConfirmation } from '../../stripe-slice.js';
import { AvatarProfilePhoto } from './AvatarProfilePhoto/AvatarProfilePhoto';
import backGroundImage from './backgroundImage.jpeg';
import { BadgeBilling } from './BadgeBilling/BadgeBilling.js';
import { BadgePlan } from './BadgePlan/BadgePlan.js';
import { BtnHistoryExportDisabled } from './BtnHistoryExportDisabled/BtnHistoryExportDisabled.js';
import { BtnUpgrade } from './BtnUpgrade/BtnUpgrade.js';
import { ButtonContact } from './ButtonContact/ButtonContact.js';
import { ButtonUpgrade2 } from './ButtonUpgrade2/ButtonUpgrade2';
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
    loader?: string;
  };
}

export const Container: FC<Props> = memo(function Container(props = {}) {
  const { firstName, lastName, email, picture } = useSelector(selectUserMetadata);
  const devTools = useSelector(selectDevTools);
  const defaultValue = useRef<FigmaConfigGenPayload>({ auth0id: '', numberOfGeneratedConfigs: 1 });

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    switch (e.target.name) {
      case 'authId':
        defaultValue.current.auth0id = e.target.value;
        break;
      case 'numberOfGeneratedConfigs':
        defaultValue.current.numberOfGeneratedConfigs = Number(e.target.value);
        break;
    }
  }, []);

  const isFreeUser = useSelector(selectIsFreeUser);
  const hasRoleFreeStripeAccess = useSelector(selectFreeStripeAccess);
  const isPaymentDone = useSelector(selectPaymentConfirmation);

  if (isPaymentDone) {
    return <PaymentConfirmation />;
  }
  if (typeof picture === 'undefined') {
    return (
      <div className={`${classes.loader} ${props.classes?.loader || ''}`}>
        <Loading />
        <p>Your settings page are being loaded...</p>
      </div>
    );
  }
  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <div className={`${classes.imageWrapOuter} ${props.classes?.imageWrapOuter || ''}`}>
        <div className={`${classes.imageWrapInner} ${props.classes?.imageWrapInner || ''}`}>
          <div
            style={{ backgroundImage: `url(${backGroundImage})` }}
            className={`${classes.image} ${props.classes?.image || ''}`}
          ></div>
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
                <BadgePlan />
                <BadgeBilling />
              </div>
            </div>
          </div>
        </div>
        <div className={`${classes.actions} ${props.classes?.actions || ''}`}>
          {isFreeUser && (
            <>
              <div className={`${classes.btnContainer}`}>
                <BtnUpgrade />
                {/* <ButtonUpgrade /> */}
                <ButtonUpgrade2 />
              </div>
              <BtnHistoryExportDisabled />
            </>
          )}
          {!isFreeUser && !hasRoleFreeStripeAccess && (
            <>
              <div className={`${classes.btnContainer}`}>
                <ButtonViewPlan />
                <ButtonContact />
              </div>
              <BtnHistoryExportDisabled />
            </>
          )}
          {(env.isDev || devTools) && (
            <>
              <h3>admin</h3>
              <TextField
                id='standard-basic'
                label='authId'
                name='authId'
                variant='standard'
                defaultValue={defaultValue.current.auth0id}
                onChange={handleChange}
                helperText={'auth0Id of the user you want to generate figma from his saved configs.'}
              />
              <Input
                type='number'
                name='numberOfGeneratedConfigs'
                inputProps={{ min: 1 }}
                placeholder={'Number of figma configs you want'}
                defaultValue={defaultValue.current.numberOfGeneratedConfigs}
                onChange={handleChange}
              />
              <Button
                variant={'contained'}
                onClick={() => {
                  renderFigmaConfig(defaultValue.current);
                }}
              >
                Generate
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
