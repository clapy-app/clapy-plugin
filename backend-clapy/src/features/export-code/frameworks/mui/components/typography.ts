import ts from 'typescript';

import type { InstanceNode2, TextNode2 } from '../../../create-ts-compiler/canvas-utils.js';
import { isText } from '../../../create-ts-compiler/canvas-utils.js';
import { warnNode } from '../../../gen-node-utils/utils-and-reset.js';
import type { MUIConfig, VariantProps } from '../mui-config.js';
import { typoMappingConfig } from '../mui-theme-typography.js';

const { factory } = ts;

const variantPropsMapping: VariantProps = {
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
  variantPropsMapping,
  extractChildren: (node: InstanceNode2) => {
    const textNode = node.children[0] as TextNode2 | undefined;
    if (!isText(textNode)) {
      warnNode(node, 'Typography node which first child is not a Text node:', JSON.stringify(textNode));
    }
    return textNode?._textSegments?.map(segment => segment.characters).join('');
  },
};
