import ts from 'typescript';

import { InstanceNode2, isText, TextNode2 } from '../../../create-ts-compiler/canvas-utils';
import { warnNode } from '../../../figma-code-map/details/utils-and-reset';
import { MUIConfig, VariantProps } from '../mui-config';
import { typoMappingConfig } from '../mui-theme-typography';

const { factory } = ts;

const typographyPropsMapping: VariantProps = {
  Variant: {
    name: 'variant',
    valuesMap: typoMappingConfig.Typography,
  },
  // 'Dark Mode': {},
};

export const figmaNameMUITypography = 'Typography';
export const muiConfigTypography: MUIConfig = {
  name: 'Typography',
  moduleSpecifier: '@mui/material',
  variantPropsMapping: typographyPropsMapping,
  extractChildren: (node: InstanceNode2) => {
    const textNode = node.children[0] as TextNode2 | undefined;
    if (!isText(textNode)) {
      warnNode(node, 'Typography node which first child is not a Text node:', JSON.stringify(textNode));
    }
    return textNode?._textSegments?.map(segment => segment.characters).join('');
  },
};
