import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel.js';
import Switch from '@mui/material/Switch/Switch.js';
import Tooltip from '@mui/material/Tooltip/Tooltip.js';
import type { ChangeEvent, FC } from 'react';
import { useRef, memo } from 'react';
import { useSelector } from 'react-redux';

import { appConfig } from '../../../../common/app-config.js';
import type { UserSettings } from '../../../../common/sb-serialize.model.js';
import { selectCssOptionEnabled } from '../../../../core/auth/auth-slice.js';
import classes from './CustomCssSetting.module.css';
import { CssEditor } from './CssEditor.js';
import { selectCodeGenIsLoading, selectCustomCssSetting } from '../../export-code-slice.js';
import { useCallbackAsync2 } from '../../../../front-utils/front-utils.js';
import { createSettingName, setOneUserSetting } from '../../export-code-utils.js';

interface Props {}

const name = createSettingName('customCss');
type Name = typeof name;

export const AddCssOption: FC<Props> = memo(function AddCssOption(props) {
  const isCssOptionEnabled = useSelector(selectCssOptionEnabled);
  if (!isCssOptionEnabled) return null;
  return <AddCssOptionInner {...props} />;
});

const AddCssOptionInner: FC<Props> = memo(function AddCssOptionInner(props) {
  const customCssSetting = useSelector(selectCustomCssSetting);
  const initialValue = useRef(customCssSetting).current;
  const isLoading = useSelector(selectCodeGenIsLoading);
  const changeSetting = useCallbackAsync2(async (event: ChangeEvent<HTMLInputElement>, settingValue: boolean) => {
    await setOneUserSetting(event.target.name as Name, settingValue as UserSettings[Name]);
  }, []);

  return (
    <div className={classes.root}>
      <Tooltip
        title={
          <div className={classes.tooltipWrapper}>
            <div>
              Check to show the custom CSS rules that are added on the selected element. Custom CSS is useful if the
              generated CSS must be patched. You can select child elements and apply CSS on them. Clear the editor to
              remove the custom CSS.
            </div>
            <div>
              Instances inherit from the component rules, unless you override them. Clear the editor to reset to the
              component styles.
            </div>
          </div>
        }
        disableInteractive
        placement={appConfig.tooltipPosition}
      >
        <FormControlLabel
          control={<Switch name={name} onChange={changeSetting} defaultChecked={initialValue} />}
          label={`Show custom CSS (selection - alpha)`}
          disabled={isLoading}
        />
      </Tooltip>
      {customCssSetting && <CssEditor isLoading={isLoading} />}
    </div>
  );
});
