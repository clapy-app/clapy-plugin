import Button from '@mui/material/Button/Button.js';
import FormControl from '@mui/material/FormControl/FormControl.js';
import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel.js';
import Radio from '@mui/material/Radio/Radio.js';
import type { RadioGroupProps } from '@mui/material/RadioGroup/RadioGroup.js';
import RadioGroup from '@mui/material/RadioGroup/RadioGroup.js';
import Tooltip from '@mui/material/Tooltip/Tooltip.js';
import type { FC } from 'react';
import { memo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { appConfig } from '../../../common/app-config.js';
import { fetchPlugin } from '../../../common/plugin-utils.js';
import type { UserSettings } from '../../../common/sb-serialize.model.js';
import { UserSettingsTarget } from '../../../common/sb-serialize.model.js';
import { requestAdditionalScopes } from '../../../core/auth/auth-service.js';
import { selectGithubEnabled, selectTokenDecoded } from '../../../core/auth/auth-slice.js';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
import { apiPost } from '../../../front-utils/http.utils.js';
import type { UserSettingsValues } from '../FigmaToCodeHome/figmaToCode-model.js';
import classes from './GithubOption.module.css';

interface Props {
  className?: string;
  isLoading: boolean;
  defaultSettings: UserSettings;
  updateAdvancedOption: (event: React.ChangeEvent<HTMLInputElement>, checked: UserSettingsValues) => void;
}

export const GithubOption: FC<Props> = memo(function GithubOption(props) {
  const isGithubEnabled = useSelector(selectGithubEnabled);
  if (!isGithubEnabled) return null;
  return <GithubOptionInner {...props} />;
});

interface ListReposReq {
  githubAccessToken?: string;
}

interface GHRepo {}

interface ListReposResp {
  githubAccessToken: string;
  repositories: GHRepo[];
}

const GithubOptionInner: FC<Props> = memo(function GithubOptionInner(props) {
  const { className, isLoading, defaultSettings, updateAdvancedOption } = props;
  const [target, setTarget] = useState(defaultSettings.target);
  const token = useSelector(selectTokenDecoded);
  const updateTargetState = useCallback<NonNullable<RadioGroupProps['onChange']>>(
    (event, value0) => {
      const value = value0 as UserSettingsTarget;
      setTarget(value);
      updateAdvancedOption(event, value);
      // Match the legacy zip setting until the API is updated
      updateAdvancedOption(
        { target: { name: 'zip' } } as React.ChangeEvent<HTMLInputElement>,
        value === UserSettingsTarget.zip,
      );
    },
    [updateAdvancedOption],
  );

  if (target === UserSettingsTarget.github) {
    // console.log('This is github.');
  }
  // console.log('token:', token);
  const requestRepoScope = useCallbackAsync2(async () => {
    // Later, for other operations with github:
    // let githubAccessToken = await fetchPlugin('getGithubCachedToken');
    let githubAccessToken: string | undefined;
    await requestAdditionalScopes(['repo', 'user:email']);
    const { data } = await apiPost<ListReposResp>('github/list-repos', {
      githubAccessToken: undefined,
    } as ListReposReq);
    let repositories: GHRepo[];
    ({ githubAccessToken, repositories } = data);
    await fetchPlugin('setGithubCachedToken', githubAccessToken);
    console.log('repositories:', repositories);
  }, []);

  return (
    <div className={`${className} ${classes.root}`}>
      <FormControl disabled={isLoading}>
        <RadioGroup row name='target' onChange={updateTargetState} defaultValue={defaultSettings.target}>
          <Tooltip
            title='Uploads the generated code to CodeSandbox. Useful for a super quick preview and review of its source code.'
            disableInteractive
            placement={appConfig.tooltipPosition}
          >
            <FormControlLabel value={UserSettingsTarget.csb} control={<Radio />} label='CodeSandbox' />
          </Tooltip>
          <Tooltip
            title='Downloads the generated source code as a zip file. You need you unarchive, `yarn install` and `yarn start` to run the application locally.'
            disableInteractive
            placement={appConfig.tooltipPosition}
          >
            <FormControlLabel value={UserSettingsTarget.zip} control={<Radio />} label='Zip' />
          </Tooltip>
          <Tooltip
            title='Sends the generated code to the selected github repository, in a new branch, and creates a pull request to merge it with your main branch.'
            disableInteractive
            placement={appConfig.tooltipPosition}
          >
            <FormControlLabel value={UserSettingsTarget.github} control={<Radio />} label='Github' />
          </Tooltip>
        </RadioGroup>
      </FormControl>
      {target === UserSettingsTarget.github && <Button onClick={requestRepoScope}>Add scopes</Button>}
    </div>
  );
});