import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel.js';
import Switch from '@mui/material/Switch/Switch.js';
import Tooltip from '@mui/material/Tooltip/Tooltip.js';
import type { ChangeEvent, FC } from 'react';
import { memo } from 'react';
import { appConfig } from '../../../common/app-config.js';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
import { useSelectorOnce } from '../../../core/redux/redux.utils.js';
import { selectCodeGenIsLoading, selectScssSetting } from '../export-code-slice.js';
import { useSelector } from 'react-redux';
import { createSettingName, setOneUserSetting } from '../export-code-utils.js';
import type { UserSettings } from '../../../common/sb-serialize.model.js';

interface Props {}

const name = createSettingName('scss');
type Name = typeof name;

export const ScssSetting: FC<Props> = memo(function ScssSetting(props) {
  const initialValue = useSelectorOnce(selectScssSetting);
  const isLoading = useSelector(selectCodeGenIsLoading);
  const changeSetting = useCallbackAsync2(
    async (event: ChangeEvent<HTMLInputElement>, settingValue: UserSettings[Name]) => {
      await setOneUserSetting(event.target.name as Name, settingValue);
    },
    [],
  );
  return (
    <Tooltip
      title='If enabled, styles will be written in .scss files instead of .css.'
      disableInteractive
      placement={appConfig.tooltipPosition}
    >
      <FormControlLabel
        control={<Switch name={name} onChange={changeSetting} defaultChecked={!!initialValue} />}
        label='SCSS instead of CSS (alpha)'
        disabled={isLoading}
      />
    </Tooltip>
  );
});
