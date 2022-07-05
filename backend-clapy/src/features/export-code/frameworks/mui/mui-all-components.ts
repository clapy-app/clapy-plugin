import { figmaNameMUIButton, muiConfigButton } from './components/button.js';
import { figmaNameMUIIconButton, muiConfigIconButton } from './components/icon-button.js';
import { figmaNameMUITypography, muiConfigTypography } from './components/typography.js';
import { makeMuiConfigs } from './mui-config.js';

export const muiComponents = makeMuiConfigs({
  [figmaNameMUITypography]: muiConfigTypography,
  [figmaNameMUIButton]: muiConfigButton,
  [figmaNameMUIIconButton]: muiConfigIconButton,
});
