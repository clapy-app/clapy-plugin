import FormControl from '@mui/material/FormControl/FormControl.js';
import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel.js';
import Switch from '@mui/material/Switch/Switch.js';
import Tooltip from '@mui/material/Tooltip/Tooltip.js';
import type { ChangeEvent, FC } from 'react';
import { memo } from 'react';
import { appConfig } from '../../../common/app-config.js';
import classes from '../FigmaToCodeHome/FigmaToCodeHome.module.css';
import { useCallbackAsync2 } from '../../../front-utils/front-utils.js';
import { useSelectorOnce } from '../../../core/redux/redux.utils.js';
import { selectCodeGenIsLoading, selectPageSetting } from '../export-code-slice.js';
import { useSelector } from 'react-redux';
import { createSettingName, setUserSetting } from '../export-code-utils.js';
import type { UserSettings } from '../../../common/sb-serialize.model.js';

interface Props {}

const name = createSettingName('page');
type Name = typeof name;

export const PageSetting: FC<Props> = memo(function PageSetting(props) {
  const initialValue = useSelectorOnce(selectPageSetting);
  const loading = useSelector(selectCodeGenIsLoading);
  const changeSetting = useCallbackAsync2(
    async (event: ChangeEvent<HTMLInputElement>, settingValue: UserSettings[Name]) => {
      await setUserSetting(event.target.name as Name, settingValue);
    },
    [],
  );
  return (
    <Tooltip
      title='If enabled, the selected element will be stretched to use all width and height available, even if "Fill container" is not set. Useful for top-level frames that are pages.'
      disableInteractive
      placement={appConfig.tooltipPosition}
    >
      <FormControl disabled={loading} className={classes.outerOption}>
        <FormControlLabel
          control={<Switch name='page' onChange={changeSetting} defaultChecked={!!initialValue} />}
          label='Full width/height (for pages)'
          disabled={loading}
        />
      </FormControl>
    </Tooltip>
  );
});
