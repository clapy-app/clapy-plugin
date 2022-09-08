import FormControl from '@mui/material/FormControl/FormControl.js';
import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel.js';
import Radio from '@mui/material/Radio/Radio.js';
import RadioGroup from '@mui/material/RadioGroup/RadioGroup.js';
import Tooltip from '@mui/material/Tooltip/Tooltip.js';
import type { ChangeEvent, FC } from 'react';
import { useRef, memo } from 'react';
import { useSelector } from 'react-redux';
import { appConfig } from '../../../common/app-config.js';
import type { UserSettings } from '../../../common/sb-serialize.model.js';
import { UserSettingsTarget } from '../../../common/sb-serialize.model.js';
import { selectGithubEnabled, selectNoCodesandboxUser } from '../../../core/auth/auth-slice.js';
import classes from './TargetSetting.module.css';
import { GithubOption } from '../github/GithubOption.js';
import { createSettingName, setUserSetting } from '../export-code-utils.js';
import { selectCodeGenIsLoading, selectTargetSetting } from '../export-code-slice.js';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';

interface Props {}

const name = createSettingName('target');
type Name = typeof name;

export const GenTargetOptions: FC<Props> = memo(function GenTargetOptions(props) {
  const isGithubEnabled = useSelector(selectGithubEnabled);
  if (!isGithubEnabled) return null;
  return <GenTargetOptionsInner {...props} />;
});

const GenTargetOptionsInner: FC<Props> = memo(function GenTargetOptionsInner(props) {
  const targetSetting = useSelector(selectTargetSetting);
  const initialValue = useRef(targetSetting).current;
  const isLoading = useSelector(selectCodeGenIsLoading);
  const changeSetting = useCallbackAsync2(async (event: ChangeEvent<HTMLInputElement>, settingValue: string) => {
    await setUserSetting(event.target.name as Name, settingValue as UserSettings[Name]);
    // Remove legacy setting
    await setUserSetting('zip', undefined);
  }, []);
  const isNoCodeSandboxUser = useSelector(selectNoCodesandboxUser);

  return (
    <div className={classes.root}>
      <FormControl disabled={isLoading}>
        <RadioGroup row name='target' onChange={changeSetting} defaultValue={initialValue}>
          {!isNoCodeSandboxUser && (
            <Tooltip
              title='Uploads the generated code to CodeSandbox. Useful for a super quick preview and review of its source code. Please note that CodeSandbox projects are public.'
              disableInteractive
              placement={appConfig.tooltipPosition}
            >
              <FormControlLabel
                value={UserSettingsTarget.csb}
                control={<Radio />}
                disabled={isLoading}
                label='CodeSandbox'
              />
            </Tooltip>
          )}
          <Tooltip
            title='Sends the generated code to the selected github repository, in a new branch, and creates a pull request to merge it with the target branch.'
            disableInteractive
            placement={appConfig.tooltipPosition}
          >
            <FormControlLabel
              value={UserSettingsTarget.github}
              control={<Radio />}
              disabled={isLoading}
              label='Github'
            />
          </Tooltip>
          <Tooltip
            title='Downloads the generated source code as a zip file. You need you unarchive, `yarn install` and `yarn start` to run the application locally.'
            disableInteractive
            placement={appConfig.tooltipPosition}
          >
            <FormControlLabel value={UserSettingsTarget.zip} control={<Radio />} disabled={isLoading} label='Zip' />
          </Tooltip>
        </RadioGroup>
      </FormControl>
      {targetSetting === UserSettingsTarget.github && <GithubOption isLoading={isLoading} />}
    </div>
  );
});
