import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel.js';
import Switch from '@mui/material/Switch/Switch.js';
import Tooltip from '@mui/material/Tooltip/Tooltip.js';
import type { ChangeEvent, FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';

import { appConfig } from '../../../common/app-config.js';
import type { UserSettings } from '../../../common/sb-serialize.model.js';
import { useSelectorOnce } from '../../../core/redux/redux.utils.js';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
import { selectBemSetting, selectCodeGenIsLoading, selectScssSetting } from '../export-code-slice.js';
import { createSettingName, setOneUserSetting } from '../export-code-utils.js';

interface Props {}

const name = createSettingName('bem');
type Name = typeof name;

export const ScssBemSetting: FC<Props> = memo(function ScssBemSetting(props) {
  const scssSetting = useSelector(selectScssSetting);
  if (!scssSetting) return null;
  return <ScssBemSettingInner />;
});

export const ScssBemSettingInner: FC<Props> = memo(function ScssBemSettingInner(props) {
  const initialValue = useSelectorOnce(selectBemSetting);
  const isLoading = useSelector(selectCodeGenIsLoading);
  const changeSetting = useCallbackAsync2(
    async (event: ChangeEvent<HTMLInputElement>, settingValue: UserSettings[Name]) => {
      await setOneUserSetting(event.target.name as Name, settingValue);
    },
    [],
  );
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
