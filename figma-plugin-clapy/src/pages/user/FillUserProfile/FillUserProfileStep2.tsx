import ArrowForward from '@mui/icons-material/ArrowForward';
import LoadingButton from '@mui/lab/LoadingButton';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import SvgIcon from '@mui/material/SvgIcon';
import TextField from '@mui/material/TextField';
import type { ChangeEvent, FC, MouseEvent } from 'react';
import { memo, useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { UserMetaUsage } from '../../../common/app-models.js';
import { useCallbackAsync2 } from '../../../common/front-utils';
import type { Dict } from '../../../common/sb-serialize.model';
import { LogoutButton } from '../../Layout/LogoutButton/LogoutButton';
import { updateUserMetaUsage } from '../user-service';
import { selectHasMissingMetaUsage, selectUserMetaUsage } from '../user-slice';
import classes from './FillUserProfile.module.css';
import { FastForwardIcon } from './icons/FastForwardIcon';
import { RefreshCwIcon } from './icons/RefreshCwIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ZapIcon } from './icons/ZapIcon';
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
    frame89?: string;
    frame94?: string;
    frame98?: string;
    submitButton?: string;
  };
}

export const FillUserProfileStep2: FC<Props> = memo(function FillUserProfile(props = {}) {
  const dispatch = useDispatch();
  const userMetaUsage = useSelector(selectUserMetaUsage) || {};
  const hasMissingMetaUsage = useSelector(selectHasMissingMetaUsage);

  // Form model
  const [components, setComponents] = useState(userMetaUsage.components);
  const [designSystem, setDesignSystem] = useState(userMetaUsage.designSystem);
  const [landingPages, setLandingPages] = useState(userMetaUsage.landingPages);
  const [other, setOther] = useState(userMetaUsage.other);
  const [otherDetail, setOtherDetail] = useState(userMetaUsage.otherDetail);
  const otherDetailDefaultRef = useRef(userMetaUsage.otherDetail || '');
  // Follow-up if the form is complete (i.e. at least one usage provided)
  const [atLeastOneFilled, setAtLeastOneFilled] = useState(!hasMissingMetaUsage);

  // When submitting, loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const submitMetaUsage = useCallbackAsync2(
    async (e: MouseEvent<HTMLButtonElement>) => {
      try {
        setIsLoading(true);
        await updateUserMetaUsage({ components, designSystem, landingPages, other, otherDetail }, dispatch);
      } finally {
        setIsLoading(false);
      }
    },
    [components, designSystem, dispatch, landingPages, other, otherDetail],
  );

  const handleChange = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const btn = e.target as HTMLButtonElement;
      if (!btn.dataset.name) {
        throw new Error('BUG btn.dataset.name has not been provided.');
      }
      const usageField = btn.dataset.name as keyof UserMetaUsage;
      let components2 = components;
      let designSystem2 = designSystem;
      let landingPages2 = landingPages;
      let other2 = other;
      if (usageField === 'components') {
        components2 = !components;
        setComponents(components2);
      } else if (usageField === 'designSystem') {
        designSystem2 = !designSystem;
        setDesignSystem(designSystem2);
      } else if (usageField === 'landingPages') {
        landingPages2 = !landingPages;
        setLandingPages(landingPages2);
      } else if (usageField === 'other') {
        other2 = !other;
        setOther(other2);
      }
      setAtLeastOneFilled(!!(components2 || designSystem2 || landingPages2 || (other2 && otherDetail)));
    },
    [components, designSystem, landingPages, other, otherDetail],
  );

  const changeOtherDetail = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setOtherDetail(e.target.value);
      setAtLeastOneFilled(!!(components || designSystem || landingPages || (other && e.target.value)));
    },
    [components, designSystem, landingPages, other],
  );

  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <LogoutButton absolute />
      <div className={`${classes.container} ${props.classes?.container || ''}`}>
        <div className={`${classes.frame99} ${props.classes?.frame99 || ''}`}>
          <ProgressStepsProgressTextWithL step2 />
          <div className={`${classes.headline} ${props.classes?.headline || ''}`}>
            <div className={`${classes.welcomeToClapy} ${props.classes?.welcomeToClapy || ''}`}>How can we help?</div>
            <div className={`${classes.letSSetUpYourAccount} ${props.classes?.letSSetUpYourAccount || ''}`}>
              I want to use Clapy to...
            </div>
          </div>
          <div className={`${classes.form} ${props.classes?.form || ''}`}>
            <Button
              data-name='components'
              size='large'
              variant='outlined'
              color={components ? 'primary' : 'neutral'}
              className={classes.selectionButtons}
              startIcon={
                <SvgIcon className={classes.buttonIcon}>
                  <RefreshCwIcon />
                </SvgIcon>
              }
              onClick={handleChange}
            >
              Get clean, reusable components
            </Button>
            <Button
              data-name='designSystem'
              size='large'
              variant='outlined'
              color={designSystem ? 'primary' : 'neutral'}
              className={classes.selectionButtons}
              startIcon={
                <SvgIcon className={classes.buttonIcon}>
                  <FastForwardIcon />
                </SvgIcon>
              }
              onClick={handleChange}
            >
              Streamline a Design System workflow
            </Button>
            <Button
              data-name='landingPages'
              size='large'
              variant='outlined'
              color={landingPages ? 'primary' : 'neutral'}
              className={classes.selectionButtons}
              startIcon={
                <SvgIcon className={classes.buttonIcon}>
                  <ZapIcon />
                </SvgIcon>
              }
              onClick={handleChange}
            >
              Create landing pages faster
            </Button>
            <Button
              data-name='other'
              size='large'
              variant='outlined'
              color={other ? 'primary' : 'neutral'}
              className={classes.selectionButtons}
              startIcon={
                <SvgIcon className={classes.buttonIcon}>
                  <XCircleIcon />
                </SvgIcon>
              }
              onClick={handleChange}
            >
              Other reason
            </Button>
            <TextField
              className={`${classes.textField} ${other ? '' : classes.hide}`}
              name='otherDetail'
              label='Please detail'
              variant='outlined'
              size='small'
              defaultValue={otherDetailDefaultRef.current}
              onChange={changeOtherDetail}
            />
          </div>
          <LoadingButton
            size='large'
            variant='contained'
            className={classes.submitButton}
            endIcon={<ArrowForward />}
            disabled={!atLeastOneFilled || isLoading}
            loading={isLoading}
            onClick={submitMetaUsage}
          >
            Start generating code
          </LoadingButton>
        </div>
      </div>
    </div>
  );
});

function objToMenuItems(obj: Dict<string>) {
  return Object.entries(obj).map(([key, label]) => (
    <MenuItem value={key} key={key}>
      {label}
    </MenuItem>
  ));
}
