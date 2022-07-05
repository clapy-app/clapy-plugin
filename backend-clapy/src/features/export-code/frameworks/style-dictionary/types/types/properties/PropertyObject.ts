import type { Properties } from '../../constants/Properties.js';

export type PropertyObject = {
  name: Properties;
  label: string;
  icon?: 'Gap' | 'Spacing';
  clear?: Properties[];
  forcedValue?: string; // @TODO check typing
};
