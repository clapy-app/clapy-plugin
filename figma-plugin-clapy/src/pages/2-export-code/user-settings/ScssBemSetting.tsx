import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel.js';
import Switch from '@mui/material/Switch/Switch.js';
import Tooltip from '@mui/material/Tooltip/Tooltip.js';
import type { ChangeEvent, FC } from 'react';
import { memo } from 'react';
import { appConfig } from '../../../common/app-config.js';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
import { useSelectorOnce } from '../../../core/redux/redux.utils.js';
import { selectBemSetting, selectCodeGenIsLoading, selectScssSetting } from '../export-code-slice.js';
import { useSelector } from 'react-redux';
import { createSettingName, setUserSetting } from '../export-code-utils.js';
import type { UserSettings } from '../../../common/sb-serialize.model.js';

interface Props {}

const name = createSettingName('bem');
type Name = typeof name;

export const ScssBemSetting: FC<Props> = memo(function ScssBemSetting(props) {
  const scssSetting = useSelector(selectScssSetting);
  const initialValue = useSelectorOnce(selectBemSetting);
  const isLoading = useSelector(selectCodeGenIsLoading);
  const changeSetting = useCallbackAsync2(
    async (event: ChangeEvent<HTMLInputElement>, settingValue: UserSettings[Name]) => {
      await setUserSetting(event.target.name as Name, settingValue);
    },
    [],
  );
  if (!scssSetting) return null;
  return (
    <Tooltip
      title='If enabled, the generated SCSS is a tree of classes following the BEM convention instead of top-level classes only. CSS modules make most of BEM obsolete, but it is useful for legacy projects.'
      disableInteractive
      placement={appConfig.tooltipPosition}
    >
      <FormControlLabel
        control={<Switch name={name} onChange={changeSetting} defaultChecked={!!initialValue} />}
        label='Indent classes with BEM convention'
        disabled={isLoading}
      />
    </Tooltip>
  );
});
