import FormControl from '@mui/material/FormControl/FormControl.js';
import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel.js';
import Radio from '@mui/material/Radio/Radio.js';
import RadioGroup from '@mui/material/RadioGroup/RadioGroup.js';
import Tooltip from '@mui/material/Tooltip/Tooltip.js';
import type { ChangeEvent, FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';

import { appConfig } from '../../../common/app-config.js';
import type { UserSettings } from '../../../common/sb-serialize.model.js';
import { readSelectorOnce, useSelectorOnce } from '../../../core/redux/redux.utils.js';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
import { selectCodeGenIsLoading, selectComponentsDirSetting, selectFrameworkSetting } from '../export-code-slice.js';
import { componentsDirPerFramework, createSettingName, setUserSetting } from '../export-code-utils.js';
import classes2 from './CustomCssSetting/CustomCssSetting.module.css';

interface Props {}

const name = createSettingName('framework');
type Name = typeof name;

export const FrameworkSetting: FC<Props> = memo(function FrameworkSetting(props) {
  const initialValue = useSelectorOnce(selectFrameworkSetting);
  const isLoading = useSelector(selectCodeGenIsLoading);
  const changeSetting = useCallbackAsync2(async (event: ChangeEvent<HTMLInputElement>, settingValue: string) => {
    const newFramework = settingValue as UserSettings[Name];
    const prevFramework = readSelectorOnce(selectFrameworkSetting);
    const prevComponentsDir = readSelectorOnce(selectComponentsDirSetting);
    const newSettings: UserSettings = {
      [event.target.name as Name]: newFramework,
    };
    if (
      newFramework &&
      newFramework !== prevFramework &&
      (!prevFramework || prevComponentsDir === componentsDirPerFramework[prevFramework])
    ) {
      newSettings.componentsDir = componentsDirPerFramework[newFramework];
    }
    await setUserSetting(newSettings);
  }, []);
  return (
    <FormControl disabled={isLoading}>
      <RadioGroup row name={name} onChange={changeSetting} defaultValue={initialValue}>
        <Tooltip title='Generates React code.' disableInteractive placement={appConfig.tooltipPosition}>
          <FormControlLabel value='react' control={<Radio disabled={isLoading} />} disabled={isLoading} label='React' />
        </Tooltip>
        <Tooltip
          title={
            <div className={classes2.tooltipWrapper}>
              <div>Generates Angular code.</div>
              <div>
                Alpha limitation: only components are supported. All customizations applied on Figma instances
                (including custom CSS on instance nodes) are ignored. For this reason, the result may not exactly match
                the Figma design. For pixel-perfect, please choose React instead.
              </div>
            </div>
          }
          disableInteractive
          placement={appConfig.tooltipPosition}
        >
          <FormControlLabel
            value='angular'
            control={<Radio disabled={isLoading} />}
            disabled={isLoading}
            label='Angular (alpha)'
          />
        </Tooltip>
      </RadioGroup>
    </FormControl>
  );
});
