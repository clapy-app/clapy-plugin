import FormControl from '@mui/material/FormControl/FormControl.js';
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
import { selectCodeGenIsLoading, selectPageSetting } from '../export-code-slice.js';
import { createSettingName, setOneUserSetting } from '../export-code-utils.js';
import classes from '../FigmaToCodeHome/FigmaToCodeHome.module.css';

interface Props {}

const name = createSettingName('page');
type Name = typeof name;

export const PageSetting: FC<Props> = memo(function PageSetting(props) {
  const initialValue = useSelectorOnce(selectPageSetting);
  const isLoading = useSelector(selectCodeGenIsLoading);
  const changeSetting = useCallbackAsync2(
    async (event: ChangeEvent<HTMLInputElement>, settingValue: UserSettings[Name]) => {
      await setOneUserSetting(event.target.name as Name, settingValue);
    },
    [],
  );
  return (
    <Tooltip
      title='If enabled, the selected element will be stretched to use all width and height available, even if "Fill container" is not set. Useful for top-level frames that are pages.'
      disableInteractive
      placement={appConfig.tooltipPosition}
    >
      <FormControl disabled={isLoading} className={classes.outerOption}>
        <FormControlLabel
          control={<Switch name={name} onChange={changeSetting} defaultChecked={!!initialValue} />}
          label='Full width/height (for pages)'
          disabled={isLoading}
        />
      </FormControl>
    </Tooltip>
  );
});
