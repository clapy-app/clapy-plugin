import LoadingButton from '@mui/lab/LoadingButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import type { ChangeEvent, FC, MouseEvent } from 'react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { UserMetadata } from '../../../common/app-models.js';
import { useCallbackAsync2 } from '../../../common/front-utils';
import type { Dict } from '../../../common/sb-serialize.model';
import { Loading } from '../../../components-used/Loading/Loading.js';
import { LogoutButton } from '../../Layout/LogoutButton/LogoutButton';
import { hasMissingMetaProfile, updateUserMetadata } from '../user-service';
import { selectUserMetadata, selectUserProfileState } from '../user-slice';
import classes from './FillUserProfile.module.css';
import { ProgressStepsProgressTextWithL } from './ProgressStepsProgressTextWithL/ProgressStepsProgressTextWithL';

const roles = {
  ux_ui_designer: 'UX/UI Designer',
  software_engineer: 'Software Engineer',
  product_manager_owner: 'Product Manager/Owner',
  founder_c_level: 'Founder & C-level',
  marketing_manager: 'Marketing Manager',
};

const teamSizes = {
  _1_side: 'Solopreneur / side project',
  _1_solo: 'Freelancer',
  _2_5: '2 - 5 tech people',
  _6_15: '6 - 15 tech people',
  _16_50: '16 - 50 tech people',
  _51_100: '51 - 100 tech people',
  _more_than_100: '> 100 tech people',
};

const rolesTsx = objToMenuItems(roles);

const teamSizesTsx = objToMenuItems(teamSizes);

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

function updateAllFilled(metadata: UserMetadata, allFilled: boolean, setAllFilled: (allFilled: boolean) => void) {
  const allFilled2 = !hasMissingMetaProfile(metadata);
  if (allFilled2 !== allFilled) {
    setAllFilled(allFilled2);
  }
}

export const FillUserProfile: FC<Props> = memo(function FillUserProfile(props = {}) {
  const userMetadata = useSelector(selectUserProfileState);
  if (!userMetadata) {
    return (
      <div className={`${classes.root} ${classes.loadWrapper}`}>
        <Loading />
        <p>Loading your profile data...</p>
      </div>
    );
  }
  return <FillUserProfileInner {...props} />;
});

export const FillUserProfileInner: FC<Props> = memo(function FillUserProfileInner(props = {}) {
  const dispatch = useDispatch();
  const userMetadata = useSelector(selectUserMetadata);
  const modelRef = useRef<UserMetadata>();
  const defaultValuesRef = useRef<Partial<UserMetadata>>({});
  const [allFilled, setAllFilled] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const submitMetadata = useCallbackAsync2(
    async (e: MouseEvent<HTMLButtonElement>) => {
      try {
        setIsLoading(true);
        if (!modelRef.current) {
          console.error(
            'BUG modelRef is not ready yet in FillUserProfile#submitMetadata, which is not supposed to happen.',
          );
          return;
        }
        await updateUserMetadata(modelRef.current, dispatch);
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (!userMetadata) {
      console.log('BUG userMetadata in FillUserProfile#useEffect is falsy', userMetadata);
      return;
    }
    // Initialize when the value is available
    if (!modelRef.current) {
      const { firstName, lastName, companyName, jobRole, techTeamSize } = userMetadata;
      modelRef.current = { firstName, lastName, companyName, jobRole, techTeamSize };
      updateAllFilled(modelRef.current, allFilled, setAllFilled);
    }
  }, [allFilled, userMetadata]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!modelRef.current) {
        console.error(
          'BUG modelRef is not ready yet in FillUserProfile#handleChange, which is not supposed to happen.',
        );
        return;
      }
      const { name, value } = e.target;
      const name2 = name as keyof UserMetadata;
      if (value === modelRef.current[name2]) {
        // No change in value, ignore.
        return;
      }
      const foo = modelRef.current[name2];
      modelRef.current[name2] = value as any;
      updateAllFilled(modelRef.current, allFilled, setAllFilled);
    },
    [allFilled],
  );

  const { firstName, lastName, companyName, jobRole, techTeamSize } = userMetadata;

  // Fill default values
  if (defaultValuesRef.current.firstName == undefined) defaultValuesRef.current.firstName = firstName || '';
  if (defaultValuesRef.current.lastName == undefined) defaultValuesRef.current.lastName = lastName || '';
  if (defaultValuesRef.current.companyName == undefined) defaultValuesRef.current.companyName = companyName || '';
  if (defaultValuesRef.current.jobRole == undefined) defaultValuesRef.current.jobRole = jobRole || '';
  if (defaultValuesRef.current.techTeamSize == undefined) defaultValuesRef.current.techTeamSize = techTeamSize || '';

  return (
    <div className={`${classes.root} ${props.className || ''}`}>
      <LogoutButton absolute />
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
            <div className={`${classes.frame89} ${props.classes?.frame89 || ''}`}>
              <TextField
                className={classes.textField}
                name='firstName'
                label='First name'
                variant='outlined'
                size='small'
                defaultValue={defaultValuesRef.current.firstName}
                onChange={handleChange}
                autoFocus
              />
              <TextField
                className={classes.textField}
                name='lastName'
                label='Last name'
                variant='outlined'
                size='small'
                defaultValue={defaultValuesRef.current.lastName}
                onChange={handleChange}
              />
            </div>
            <TextField
              className={classes.textField}
              name='companyName'
              label='Company name'
              variant='outlined'
              size='small'
              defaultValue={defaultValuesRef.current.companyName}
              onChange={handleChange}
            />
            <TextField
              select
              className={classes.textField}
              name='jobRole'
              label='What best describes your role?'
              variant='outlined'
              size='small'
              defaultValue={defaultValuesRef.current.jobRole}
              onChange={handleChange}
            >
              {rolesTsx}
            </TextField>
            <TextField
              select
              className={classes.textField}
              name='techTeamSize'
              label='Tech team size'
              variant='outlined'
              size='small'
              defaultValue={defaultValuesRef.current.techTeamSize}
              onChange={handleChange}
            >
              {teamSizesTsx}
            </TextField>
          </div>
          <LoadingButton
            size='large'
            variant='contained'
            className={classes.submitButton}
            disabled={!allFilled || isLoading}
            loading={isLoading}
            onClick={submitMetadata}
          >
            Next
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
