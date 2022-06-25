import { DeclarationPlain } from 'css-tree';

import { flags } from '../../../env-and-config/app-config';
import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { isText, isVector, ValidNode } from '../create-ts-compiler/canvas-utils';
import { addStyle, resetStyleIfOverriding } from '../css-gen/css-factories-high';
import { figmaColorToCssHex, warnNode } from '../gen-node-utils/utils-and-reset';

export function effectsFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  if (!node.effects?.length) {
    resetStyleIfOverriding(context, node, styles, 'text-shadow');
    resetStyleIfOverriding(context, node, styles, 'box-shadow');
    resetStyleIfOverriding(context, node, styles, 'filter');
    resetStyleIfOverriding(context, node, styles, 'backdrop-filter');
    return;
  }
  const noBackgroundNoBorder = !node.visibleFills?.length && !node.visibleStrokes?.length;
  if (noBackgroundNoBorder) {
    resetStyleIfOverriding(context, node, styles, 'box-shadow');
    resetStyleIfOverriding(context, node, styles, 'backdrop-filter');
  }
  const nodeIsText = isText(node);

  const textShadowStyles: string[] = [];
  const boxShadowStyles: string[] = [];
  const backdropFilters: string[] = [];
  const filters: string[] = [];

  if ((node as any)._tokens?.['boxShadow']) {
    addStyle(context, node, styles, 'box-shadow', { boxShadow: '' });
  } else {
    //// Let's keep this code for now in case we need to restore the detailed version of shadows, each piece of the shadow rule using a different variable:
    ////
    // let tokens = applyTokenGroup(context, node, 'boxShadow') as TokenBoxshadowValue | TokenBoxshadowValue[] | undefined;
    // if (tokens) {
    //   if (!Array.isArray(tokens)) {
    //     tokens = [];
    //   }
    //   for (const { x, y, spread, color, blur, type } of tokens) {
    //     const isInset = type === 'innerShadow';
    //     const insetPrefix = isInset ? 'inset ' : '';
    //     if (nodeIsText && isInset) {
    //       warnNode(node, 'UNSUPPORTED Inner shadow (inset) is not supported for text nodes.');
    //       continue;
    //     }
    //     if (nodeIsText) {
    //       textShadowStyles.push(`${x} ${y} ${blur} ${color}`);
    //     } else if (insetPrefix || spread || !flags.useFilterDropShadow) {
    //       boxShadowStyles.push(`${insetPrefix}${x} ${y} ${blur} ${spread} ${color}`);
    //     } else {
    //       filters.push(`drop-shadow(${x} ${y} ${blur} ${color})`);
    //     }
    //   }
    // } else {
    for (const effect of node.effects) {
      const isInset = effect.type === 'INNER_SHADOW';
      if (nodeIsText && isInset) {
        warnNode(node, 'UNSUPPORTED Inner shadow (inset) is not supported for text nodes.');
        continue;
      }
      if (isInset || effect.type === 'DROP_SHADOW') {
        let {
          color: { r, g, b, a },
          offset: { x, y },
          radius: blurRadius,
          spread = 0,
        } = effect;
        const hex = figmaColorToCssHex({ r, g, b }, a);
        const insetPrefix = isInset ? 'inset ' : '';
        // box-shadow:
        // + supports the spread parameter
        // - it keeps a rectangle form instead of following the children shape
        // drop-shadow: the opposite
        // Let's use box-shadow if inset or with a spread or not a SVG, otherwise drop-shadow.
        if (nodeIsText) {
          textShadowStyles.push(`${x}px ${y}px ${blurRadius}px ${hex}`);
        } else if (insetPrefix || spread || !flags.useFilterDropShadow || !isVector(node)) {
          if (!noBackgroundNoBorder) {
            boxShadowStyles.push(`${insetPrefix}${x}px ${y}px ${blurRadius}px ${spread}px ${hex}`);
          }
        } else {
          filters.push(`drop-shadow(${x}px ${y}px ${blurRadius}px ${hex})`);
        }
      } else if (effect.type === 'LAYER_BLUR') {
        let { radius } = effect;
        radius = convertRadius(radius);
        filters.push(`blur(${radius}px)`);
      } else if (effect.type === 'BACKGROUND_BLUR' && !noBackgroundNoBorder) {
        let { radius } = effect;
        radius = convertRadius(radius);
        backdropFilters.push(`blur(${radius}px)`);
      }
    }
  }

  if (textShadowStyles.length) {
    addStyle(context, node, styles, 'text-shadow', textShadowStyles.join(', '));
  } else {
    resetStyleIfOverriding(context, node, styles, 'text-shadow');
  }
  if (boxShadowStyles.length) {
    addStyle(context, node, styles, 'box-shadow', boxShadowStyles.join(', '));
  } else {
    resetStyleIfOverriding(context, node, styles, 'box-shadow');
  }
  if (filters.length) {
    addStyle(context, node, styles, 'filter', filters.join(' '));
  } else {
    resetStyleIfOverriding(context, node, styles, 'filter');
  }
  if (backdropFilters.length) {
    addStyle(context, node, styles, 'backdrop-filter', backdropFilters.join(' '));
  } else {
    resetStyleIfOverriding(context, node, styles, 'backdrop-filter');
  }
}

// For blurs, it seems Figma uses values twice as the equivalent in CSS (like a diameter instead of a radius?). Found by testing and comparing on multiple values. It's not documented anywhere when implementing this.
function convertRadius(radius: number) {
  return radius / 2;
}
