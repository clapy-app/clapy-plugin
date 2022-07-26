import type { BoxShadowTypes } from '../../constants/BoxShadowTypes.js';

export type TokenBoxshadowValue = {
  color: string;
  type: BoxShadowTypes;
  x: string | number;
  y: string | number;
  blur: string | number;
  spread: string | number;
  blendMode?: string;
};
