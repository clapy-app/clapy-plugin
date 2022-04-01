import { DeclarationPlain } from 'css-tree';
import { PropertiesHyphen } from 'csstype';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import {
  CssOperators,
  cssOperators,
  mkDeclarationCss,
  mkDimensionCss,
  mkNumberCss,
  mkOperatorCss,
  mkRawCss,
  mkValueCss,
} from './css-factories-low';

type CssUnit = 'px' | '%' | 'em' | 'rem' | 'vh' | 'vw';

export function addStyle<T extends keyof PropertiesHyphen>(
  styles: Dict<DeclarationPlain>,
  name: T,
  ...value: (NonNullable<PropertiesHyphen[T]> | [number, CssUnit] | number)[]
) {
  styles[name] = mkDeclarationCss(
    name,
    mkValueCss(
      value.map(val =>
        val === 0
          ? mkNumberCss(0)
          : !Array.isArray(val)
          ? cssOperators.includes(val as CssOperators)
            ? mkOperatorCss(val as CssOperators)
            : typeof val === 'number'
            ? mkNumberCss(val)
            : mkRawCss(val.toString())
          : val[0] === 0
          ? mkNumberCss(0)
          : mkDimensionCss(val[0], val[1]),
      ),
    ),
  );
}
