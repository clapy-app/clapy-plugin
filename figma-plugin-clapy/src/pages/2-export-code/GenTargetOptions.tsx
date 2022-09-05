import FormControl from '@mui/material/FormControl/FormControl.js';
import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel.js';
import Radio from '@mui/material/Radio/Radio.js';
import type { RadioGroupProps } from '@mui/material/RadioGroup/RadioGroup.js';
import RadioGroup from '@mui/material/RadioGroup/RadioGroup.js';
import Tooltip from '@mui/material/Tooltip/Tooltip.js';
import type { FC } from 'react';
import { memo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { appConfig } from '../../common/app-config.js';
import type { UserSettings } from '../../common/sb-serialize.model.js';
import { UserSettingsTarget } from '../../common/sb-serialize.model.js';
import { selectGithubEnabled } from '../../core/auth/auth-slice.js';
import type { UserSettingsValues } from './FigmaToCodeHome/figmaToCode-model.js';
import classes from './GenTargetOptions.module.css';
import { GithubOption } from './github/GithubOption.js';

interface Props {
  className?: string;
  isLoading: boolean;
  defaultSettings: UserSettings;
  updateAdvancedOption: (event: React.ChangeEvent<HTMLInputElement>, checked: UserSettingsValues) => void;
}

export const GenTargetOptions: FC<Props> = memo(function GenTargetOptions(props) {
  const isGithubEnabled = useSelector(selectGithubEnabled);
  if (!isGithubEnabled) return null;
  return <GenTargetOptionsInner {...props} />;
});

const GenTargetOptionsInner: FC<Props> = memo(function GenTargetOptionsInner(props) {
  const { className, isLoading, defaultSettings, updateAdvancedOption } = props;
  const [target, setTarget] = useState(defaultSettings.target);
  const updateTargetState = useCallback<NonNullable<RadioGroupProps['onChange']>>(
    (event, value0) => {
      const value = value0 as UserSettingsTarget;
      setTarget(value);
      updateAdvancedOption(event, value);
    },
    [updateAdvancedOption],
  );

  return (
    <div className={`${className} ${classes.root}`}>
      <FormControl disabled={isLoading}>
        <RadioGroup row name='target' onChange={updateTargetState} defaultValue={defaultSettings.target}>
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
          <Tooltip
            title='Downloads the generated source code as a zip file. You need you unarchive, `yarn install` and `yarn start` to run the application locally.'
            disableInteractive
            placement={appConfig.tooltipPosition}
          >
            <FormControlLabel value={UserSettingsTarget.zip} control={<Radio />} disabled={isLoading} label='Zip' />
          </Tooltip>
          <Tooltip
            title='Sends the generated code to the selected github repository, in a new branch, and creates a pull request to merge it with your main branch.'
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
        </RadioGroup>
      </FormControl>
      {target === UserSettingsTarget.github && <GithubOption isLoading={isLoading} />}
    </div>
  );
});
