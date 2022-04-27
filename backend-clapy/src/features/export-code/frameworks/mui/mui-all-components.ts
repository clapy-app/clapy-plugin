import { figmaNameMUIButton, muiConfigButton } from './components/button';
import { figmaNameMUITypography, muiConfigTypography } from './components/typography';
import { makeMuiConfigs } from './mui-config';

export const muiComponents = makeMuiConfigs({
  [figmaNameMUIButton]: muiConfigButton,
  [figmaNameMUITypography]: muiConfigTypography,
});
