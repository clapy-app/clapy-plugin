import { DeclarationPlain } from 'css-tree';
import { flags } from '../../../env-and-config/app-config';
import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { isText, ValidNode } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';
import { figmaColorToCssHex } from './details/utils-and-reset';

export function effectsFigmaToCode(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  if (!node.effects.length) return;
  const nodeIsText = isText(node);

  const textShadowStyles: string[] = [];
  const boxShadowStyles: string[] = [];
  const backdropFilters: string[] = [];
  const filters: string[] = [];
  for (const effect of node.effects) {
    if (effect.type === 'INNER_SHADOW' || effect.type === 'DROP_SHADOW') {
      const {
        color: { r, g, b, a },
        offset: { x, y },
        radius: blur,
        spread = 0,
      } = effect;
      const hex = figmaColorToCssHex({ r, g, b }, a);
      const insetPrefix = !nodeIsText && effect.type === 'INNER_SHADOW' ? 'inset ' : '';
      // box-shadow:
      // + supports the spread parameter
      // - it keeps a rectangle form instead of following the children shape
      // drop-shadow: the opposite
      // Let's use box-shadow if inset or with a spread, otherwise drop-shadow.
      if (nodeIsText) {
        textShadowStyles.push(`${x}px ${y}px ${blur}px ${hex}`);
      } else if (insetPrefix || spread || !flags.useFilterDropShadow) {
        boxShadowStyles.push(`${insetPrefix}${x}px ${y}px ${blur}px ${spread}px ${hex}`);
      } else {
        filters.push(`drop-shadow(${x}px ${y}px ${blur}px ${hex})`);
      }
    } else if (effect.type === 'LAYER_BLUR') {
      const { radius } = effect;
      filters.push(`blur(${radius}px)`);
    } else if (effect.type === 'BACKGROUND_BLUR') {
      const { radius } = effect;
      backdropFilters.push(`blur(${radius}px)`);
    }
  }
  if (textShadowStyles.length) {
    addStyle(styles, 'text-shadow', textShadowStyles.join(', '));
  }
  if (boxShadowStyles.length) {
    addStyle(styles, 'box-shadow', boxShadowStyles.join(', '));
  }
  if (filters.length) {
    addStyle(styles, 'filter', filters.join(' '));
  }
  if (backdropFilters.length) {
    addStyle(styles, 'backdrop-filter', backdropFilters.join(' '));
  }
}
