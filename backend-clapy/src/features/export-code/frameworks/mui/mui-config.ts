import { Dict } from '../../../sb-serialize-preview/sb-serialize.model';
import { InstanceNode2, TextNode2 } from '../../create-ts-compiler/canvas-utils';

interface VariantProps {
  [figmaName: string]: {
    name: string;
    valuesMap: Dict<string>;
  };
}

export interface MUIConfigs {
  [figmaName: string]: MUIConfig;
}

export interface MUIConfig {
  name: string;
  moduleSpecifier: string;
  variantPropsMapping: VariantProps;
  extractChildren?: (node: InstanceNode2, config?: MUIConfig) => string | undefined;
  defaultProps?: any;
}

function makeMuiConfigs<Config extends MUIConfigs>(config: Config): Config {
  return config;
}

const buttonPropsMapping: VariantProps = {
  Size: {
    name: 'size',
    valuesMap: {
      'Medium*': 'medium',
      Small: 'small',
      Large: 'large',
    },
  },
  // Later with custom functions to extract the icon from the Figma config
  // 'Icon Left': {
  //   name: 'startIcon',
  //   valuesMap: {},
  // },
  // 'Icon Right': {
  //   name: 'endIcon',
  //   valuesMap: {},
  // },
  Color: {
    name: 'color',
    valuesMap: {
      'Primary*': 'primary',
      Secondary: 'secondary',
      Error: 'error',
      Warning: 'warning',
      Info: 'info',
      Success: 'success',
      Inherit: 'inherit',
    },
  },
  // State: {}, // Hover & co, to handle separately
  // 'Dark Mode': {},
};

export const muiComponents = makeMuiConfigs({
  'Button/Contained': {
    name: 'Button',
    moduleSpecifier: '@mui/material',
    defaultProps: { variant: 'contained' },
    variantPropsMapping: buttonPropsMapping,
    extractChildren: (node: InstanceNode2) => {
      const unstyledButton = node.children[0] as InstanceNode2 | undefined;
      const textNode = unstyledButton?.children[0] as TextNode2 | undefined;
      return textNode?._textSegments?.map(segment => segment.characters).join('');
    },
  },
});
