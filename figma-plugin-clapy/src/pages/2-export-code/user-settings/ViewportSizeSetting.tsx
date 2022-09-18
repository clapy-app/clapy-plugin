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
import { selectCodeGenIsLoading, selectPageSetting, selectViewportSizeSetting } from '../export-code-slice.js';
import { useSelector } from 'react-redux';
import { createSettingName, setOneUserSetting } from '../export-code-utils.js';
import type { UserSettings } from '../../../common/sb-serialize.model.js';

interface Props {}

const name = createSettingName('viewportSize');
type Name = typeof name;

export const ViewportSizeSetting: FC<Props> = memo(function ViewportSizeSetting(props) {
  const isPage = useSelector(selectPageSetting);
  if (!isPage) return null;
  return <ViewportSizeSettingInner />;
});

const ViewportSizeSettingInner: FC<Props> = memo(function ViewportSizeSettingInner(props) {
  const initialValue = useSelectorOnce(selectViewportSizeSetting);
  const isLoading = useSelector(selectCodeGenIsLoading);
  const changeSetting = useCallbackAsync2(
    async (event: ChangeEvent<HTMLInputElement>, settingValue: UserSettings[Name]) => {
      await setOneUserSetting(event.target.name as Name, settingValue);
    },
    [],
  );
  return (
    <Tooltip
      title={
        <div className={classes.tooltipWrapper}>
          <div>
            If enabled, the root node will be sized to 100% of the viewport (screen) width and height (100vw / 100vh)
            instead of the parent.
          </div>
          <div>This is useful to fit exactly the viewport.</div>
        </div>
      }
      disableInteractive
      placement={appConfig.tooltipPosition}
    >
      <FormControl disabled={isLoading} className={classes.outerOption}>
        <FormControlLabel
          control={<Switch name={name} onChange={changeSetting} defaultChecked={!!initialValue} />}
          label='Fit viewport'
          disabled={isLoading}
        />
      </FormControl>
    </Tooltip>
  );
});
