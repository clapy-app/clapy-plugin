import type { InstanceNode2 } from '../../../create-ts-compiler/canvas-utils.js';
import type { MUIConfig, VariantProps } from '../mui-config.js';
import { iconInstanceToAst } from '../mui-utils.js';

const variantPropsMapping: VariantProps = {
  Size: {
    name: 'size',
    valuesMap: {
      'Medium*': 'large', // Mismatch between Figma and MUI (code).
      Small: 'small',
      Large: 'large', // Not on figma, but we anticipate.
    },
  },
  Color: {
    name: 'color',
    valuesMap: {
      'Default*': 'default',
      Primary: 'primary',
      Secondary: 'secondary',
      Error: 'error',
      Warning: 'warning',
      Info: 'info',
      Success: 'success',
      Inherit: 'inherit',
    },
  },
};

const iconFontSizeMapping = {
  Large: 'large',
  'Medium*': 'medium',
  Small: 'small',
  Inherit: 'inherit',
} as const;

export const figmaNameMUIIconButton = 'IconButton';
export const muiConfigIconButton: MUIConfig = {
  name: 'IconButton',
  moduleSpecifier: '@mui/material',
  variantPropsMapping,
  extractChildren: (node, context, config) => {
    const unstyledIconButton = node.children[0] as InstanceNode2 | undefined;
    const iconWrapper = unstyledIconButton?.children[0] as InstanceNode2 | undefined;
    const iconSelected = iconWrapper?.children[0] as InstanceNode2 | undefined;

    const fontSizeFigma = iconWrapper?.variantProperties?.['Size'] as keyof typeof iconFontSizeMapping | undefined;
    const fontSize = fontSizeFigma ? iconFontSizeMapping[fontSizeFigma] : undefined;

    const [iconVarName, importAst, jsxAst] = iconInstanceToAst(iconSelected, fontSize);
    if (!importAst || !jsxAst) return;
    context.moduleContext.imports[iconVarName] = importAst;
    return jsxAst;
  },
};
