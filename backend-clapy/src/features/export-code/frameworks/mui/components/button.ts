import ts from 'typescript';

import { NodeContext } from '../../../code.model';
import { FrameNode2, InstanceNode2, isText, TextNode2 } from '../../../create-ts-compiler/canvas-utils';
import { MUIConfig, VariantProps } from '../mui-config';
import { iconInstanceToAst } from '../mui-utils';

const { factory } = ts;

function iconValueFactory(figmaVal: string, node: InstanceNode2, context: NodeContext, isLeft: boolean) {
  if (figmaVal !== 'True') {
    return;
  }
  // Search the icon name in the Figma nodes tree.
  // It is then used to generate the icon property and import the icon.
  const unstyledButton = node.children[0] as InstanceNode2 | undefined;
  const content = unstyledButton?.children[0] as FrameNode2 | undefined;
  const maskedIcon = content?.children[isLeft ? 0 : 1] as FrameNode2 | undefined;
  const icon = maskedIcon?.children[0] as InstanceNode2 | undefined;
  const [iconVarName, importAst, jsxAst] = iconInstanceToAst(icon);
  if (!importAst || !jsxAst) return;
  context.moduleContext.imports[iconVarName] = importAst;
  return jsxAst;
}

const variantPropsMapping: VariantProps = {
  Size: {
    name: 'size',
    valuesMap: {
      'Medium*': 'medium',
      Small: 'small',
      Large: 'large',
    },
  },
  'Icon Left': {
    name: 'startIcon',
    valueFactory: (figmaVal, node, context) => iconValueFactory(figmaVal, node, context, true),
  },
  'Icon Right': {
    name: 'endIcon',
    valueFactory: (figmaVal, node, context) => iconValueFactory(figmaVal, node, context, false),
  },
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
  State: {
    // Other states are native (hover, active, focus)
    name: 'disabled',
    valueFactory: (figmaVal, node, context) => {
      if (figmaVal === 'Disabled') return true;
    },
  },
  // 'Dark Mode': {},
};

export const figmaNameMUIButton = 'Button/Contained';
export const muiConfigButton: MUIConfig = {
  name: 'Button',
  moduleSpecifier: '@mui/material',
  variantPropsMapping,
  defaultProps: { variant: 'contained' },
  extractChildren: node => {
    const unstyledButton = node.children[0] as InstanceNode2 | undefined;
    let textNode = unstyledButton?.children[0] as TextNode2 | FrameNode2 | undefined;
    // If has an icon, there is a content wrapper.
    if (!isText(textNode)) {
      let maskedIconOrText = textNode?.children[0] as TextNode2 | FrameNode2 | undefined;
      // If the icon is at the first position, the text is at the second.
      if (!isText(maskedIconOrText)) {
        textNode = textNode?.children[1] as TextNode2 | undefined;
      } else {
        textNode = maskedIconOrText;
      }
    }
    return textNode?._textSegments?.map(segment => segment.characters).join('');
  },
};
