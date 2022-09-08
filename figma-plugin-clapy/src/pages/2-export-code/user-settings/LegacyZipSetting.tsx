import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel.js';
import Switch from '@mui/material/Switch/Switch.js';
import Tooltip from '@mui/material/Tooltip/Tooltip.js';
import type { ChangeEvent, FC } from 'react';
import { memo } from 'react';
import { appConfig } from '../../../common/app-config.js';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
import { useSelectorOnce } from '../../../core/redux/redux.utils.js';
import { selectCodeGenIsLoading, selectTargetSetting } from '../export-code-slice.js';
import { useSelector } from 'react-redux';
import { createSettingName, setUserSetting } from '../export-code-utils.js';
import type { UserSettings } from '../../../common/sb-serialize.model.js';
import { UserSettingsTarget } from '../../../common/sb-serialize.model.js';
import { selectGithubEnabled, selectNoCodesandboxUser } from '../../../core/auth/auth-slice.js';

interface Props {}

const name = createSettingName('zip');
type Name = typeof name;

export const LegacyZipSetting: FC<Props> = memo(function LegacyZipSetting(props) {
  const initialValue = useSelectorOnce(selectTargetSetting);
  const isLoading = useSelector(selectCodeGenIsLoading);
  const changeSetting = useCallbackAsync2(
    async (event: ChangeEvent<HTMLInputElement>, settingValue: UserSettings[Name]) => {
      await setUserSetting('target', settingValue ? UserSettingsTarget.zip : UserSettingsTarget.csb);
    },
    [],
  );
  const isNoCodeSandboxUser = useSelector(selectNoCodesandboxUser);
  const isGithubEnabled = useSelector(selectGithubEnabled);
  if (isGithubEnabled) return null;
  return (
    <Tooltip
      title={
        isNoCodeSandboxUser
          ? 'The code is downloaded as zip file instead of being sent to CodeSandbox for preview. This option is enforced for your account as a security measure.'
          : 'If enabled, the code is downloaded as zip file instead of being sent to CodeSandbox for preview. This is the best option for confidentiality.'
      }
      disableInteractive
      placement={appConfig.tooltipPosition}
    >
      <FormControlLabel
        control={
          <Switch
            name={name}
            onChange={changeSetting}
            defaultChecked={initialValue === UserSettingsTarget.zip || isNoCodeSandboxUser}
          />
        }
        label='Download as zip'
        disabled={isLoading || isNoCodeSandboxUser}
      />
    </Tooltip>
  );
});
