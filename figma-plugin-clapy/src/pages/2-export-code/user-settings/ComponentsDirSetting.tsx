import Tooltip from '@mui/material/Tooltip/Tooltip.js';
import type { ChangeEvent, FC } from 'react';
import { memo } from 'react';
import { appConfig } from '../../../common/app-config.js';
import classes from '../FigmaToCodeHome/FigmaToCodeHome.module.css';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
import { selectCodeGenIsLoading, selectComponentsDirSetting } from '../export-code-slice.js';
import { useSelector } from 'react-redux';
import { createSettingName, setOneUserSetting } from '../export-code-utils.js';
import type { UserSettings } from '../../../common/sb-serialize.model.js';
import TextField from '@mui/material/TextField/TextField.js';

interface Props {}

const name = createSettingName('componentsDir');
type Name = typeof name;

export const ComponentsDirSetting: FC<Props> = memo(function ComponentsDirSetting(props) {
  // Controlled component
  const value = useSelector(selectComponentsDirSetting);
  const isLoading = useSelector(selectCodeGenIsLoading);
  const changeSetting = useCallbackAsync2(async (event: ChangeEvent<HTMLInputElement>) => {
    await setOneUserSetting(event.target.name as Name, event.target.value as UserSettings[Name]);
  }, []);
  return (
    <Tooltip
      title='Defines the directory in which the Clapy components will be written.'
      disableInteractive
      placement={appConfig.tooltipPosition}
    >
      <TextField
        className={classes.textSetting}
        label='Components directory'
        variant='outlined'
        size='small'
        disabled={isLoading}
        value={value}
        name={name}
        onChange={changeSetting}
      />
    </Tooltip>
  );
});
