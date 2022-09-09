import type { ChangeEvent, FC } from 'react';
import { memo } from 'react';
import classes from '../FigmaToCodeHome/FigmaToCodeHome.module.css';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
import { useSelectorOnce } from '../../../core/redux/redux.utils.js';
import { selectAngularPrefixSetting, selectCodeGenIsLoading, selectIsAngular } from '../export-code-slice.js';
import { useSelector } from 'react-redux';
import { createSettingName, setOneUserSetting } from '../export-code-utils.js';
import type { UserSettings } from '../../../common/sb-serialize.model.js';
import TextField from '@mui/material/TextField/TextField.js';

interface Props {}

const name = createSettingName('angularPrefix');
type Name = typeof name;

export const AngularPrefixSetting: FC<Props> = memo(function AngularPrefixSetting(props) {
  const isAngular = useSelector(selectIsAngular);
  if (!isAngular) return null;
  return <AngularPrefixSettingInner />;
});

export const AngularPrefixSettingInner: FC<Props> = memo(function AngularPrefixSettingInner(props) {
  const initialValue = useSelectorOnce(selectAngularPrefixSetting);
  const isLoading = useSelector(selectCodeGenIsLoading);
  const changeSetting = useCallbackAsync2(async (event: ChangeEvent<HTMLInputElement>) => {
    await setOneUserSetting(event.target.name as Name, event.target.value as UserSettings[Name]);
  }, []);
  return (
    <TextField
      className={classes.textSetting}
      label='Component names prefix'
      variant='outlined'
      size='small'
      disabled={isLoading}
      defaultValue={initialValue}
      name='angularPrefix'
      onChange={changeSetting}
    />
  );
});
