import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel.js';
import type { SwitchProps } from '@mui/material/Switch/Switch.js';
import Switch from '@mui/material/Switch/Switch.js';
import Tooltip from '@mui/material/Tooltip/Tooltip.js';
import type { FC } from 'react';
import { memo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { appConfig } from '../../../../common/app-config.js';
import type { UserSettings } from '../../../../common/sb-serialize.model.js';
import { selectCssOptionEnabled } from '../../../../core/auth/auth-slice.js';
import type { UserSettingsValues } from '../figmaToCode-model.js';
import classes from './AddCssOption.module.css';
import { CssEditor } from './CssEditor.js';

interface Props {
  className?: string;
  isLoading: boolean;
  defaultSettings: UserSettings;
  updateAdvancedOption: (event: React.ChangeEvent<HTMLInputElement>, checked: UserSettingsValues) => void;
}

export const AddCssOption: FC<Props> = memo(function AddCssOption(props) {
  const isCssOptionEnabled = useSelector(selectCssOptionEnabled);
  if (!isCssOptionEnabled) return null;
  return <AddCssOptionInner {...props} />;
});

const AddCssOptionInner: FC<Props> = memo(function AddCssOptionInner(props) {
  const { className, isLoading, defaultSettings, updateAdvancedOption } = props;
  const defaultValue = defaultSettings.customCss;
  const [customCss, setCustomCss] = useState(defaultValue);
  const updateCustomCssState = useCallback<NonNullable<SwitchProps['onChange']>>(
    (event, value) => {
      setCustomCss(value);
      updateAdvancedOption(event, value);
    },
    [updateAdvancedOption],
  );

  return (
    <div className={className ? `${className} ${classes.root}` : classes.root}>
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
          control={<Switch name='customCss' onChange={updateCustomCssState} defaultChecked={defaultValue} />}
          label={`Show custom CSS (selection - alpha)`}
          disabled={isLoading}
        />
      </Tooltip>
      {customCss && <CssEditor isLoading={isLoading} />}
    </div>
  );
});
