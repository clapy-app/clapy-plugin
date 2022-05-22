import { MenuItem, TextField } from '@mui/material';
import { ChangeEvent, FC, memo, MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useCallbackAsync2 } from '../../../common/front-utils';
import { Dict } from '../../../common/sb-serialize.model';
import { Button } from '../../../components-used/Button/Button';
import { Loading } from '../../../components-used/Loading/Loading';
import { hasMissingMetadata, updateUserMetadata, UserMetadata } from '../user-service';
import { selectUserMetadata } from '../user-slice';
import classes from './FillUserProfile.module.css';
import { ProgressStepsProgressTextWithL } from './ProgressStepsProgressTextWithL/ProgressStepsProgressTextWithL';

const roles = {
  ux_ui: 'UX/UI Designer',
  tech: 'Software Engineer',
  product: 'Product Manager/Owner',
  entrepreneur: 'Entrepreneur',
  marketing: 'Marketing Manager',
};

const teamSizes = {
  _1_side: 'Only me (side project)',
  _1_solo: 'Only me (freelancer, solofounder)',
  _2_10: '2 - 10 tech people',
  _11_50: '11 - 50 tech people',
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
  const allFilled2 = !hasMissingMetadata(metadata);
  if (allFilled2 !== allFilled) {
    setAllFilled(allFilled2);
  }
}

export const FillUserProfile: FC<Props> = memo(function FillUserProfile(props = {}) {
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
    // Initialize when the value is available
    if (!modelRef.current && userMetadata) {
      modelRef.current = { ...userMetadata };
      updateAllFilled(userMetadata, allFilled, setAllFilled);
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
      modelRef.current[name2] = value;
      updateAllFilled(modelRef.current, allFilled, setAllFilled);
    },
    [allFilled],
  );

  if (!userMetadata) return <Loading />;

  const { firstName, lastName, companyName, jobRole, techTeamSize } = userMetadata;

  // Fill default values
  if (defaultValuesRef.current.firstName == undefined) defaultValuesRef.current.firstName = firstName || '';
  if (defaultValuesRef.current.lastName == undefined) defaultValuesRef.current.lastName = lastName || '';
  if (defaultValuesRef.current.companyName == undefined) defaultValuesRef.current.companyName = companyName || '';
  if (defaultValuesRef.current.jobRole == undefined) defaultValuesRef.current.jobRole = jobRole || '';
  if (defaultValuesRef.current.techTeamSize == undefined) defaultValuesRef.current.techTeamSize = techTeamSize || '';

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
          <div className={`${classes.frame98} ${props.classes?.frame98 || ''}`}>
            <div className={`${classes.submitButton} ${props.classes?.submitButton || ''}`}>
              <Button size='medium' disabled={!allFilled || isLoading} loading={isLoading} onClick={submitMetadata}>
                Next
              </Button>
            </div>
          </div>
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
