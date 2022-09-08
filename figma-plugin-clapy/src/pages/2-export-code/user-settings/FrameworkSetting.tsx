import FormControl from '@mui/material/FormControl/FormControl.js';
import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel.js';
import Tooltip from '@mui/material/Tooltip/Tooltip.js';
import type { ChangeEvent, FC } from 'react';
import { memo } from 'react';
import { appConfig } from '../../../common/app-config.js';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
import { useSelectorOnce } from '../../../core/redux/redux.utils.js';
import { selectCodeGenIsLoading, selectFrameworkSetting } from '../export-code-slice.js';
import { useSelector } from 'react-redux';
import { createSettingName, setUserSetting } from '../export-code-utils.js';
import RadioGroup from '@mui/material/RadioGroup/RadioGroup.js';
import type { UserSettings } from '../../../common/sb-serialize.model.js';
import Radio from '@mui/material/Radio/Radio.js';
import classes2 from './CustomCssSetting/CustomCssSetting.module.css';

interface Props {}

const name = createSettingName('framework');
type Name = typeof name;

export const FrameworkSetting: FC<Props> = memo(function FrameworkSetting(props) {
  const initialValue = useSelectorOnce(selectFrameworkSetting);
  const isLoading = useSelector(selectCodeGenIsLoading);
  const changeSetting = useCallbackAsync2(async (event: ChangeEvent<HTMLInputElement>, settingValue: string) => {
    await setUserSetting(event.target.name as Name, settingValue as UserSettings[Name]);
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
