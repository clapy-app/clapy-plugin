import { figmaNameMUIButton, muiConfigButton } from './components/button';
import { figmaNameMUIIconButton, muiConfigIconButton } from './components/icon-button';
import { figmaNameMUITypography, muiConfigTypography } from './components/typography';
import { makeMuiConfigs } from './mui-config';

export const muiComponents = makeMuiConfigs({
  [figmaNameMUITypography]: muiConfigTypography,
  [figmaNameMUIButton]: muiConfigButton,
  [figmaNameMUIIconButton]: muiConfigIconButton,
});
