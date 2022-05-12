import { TypographyStyle } from '@mui/material';
import { DeclarationPlain } from 'css-tree';
import { PropertiesHyphen } from 'csstype';
import { isPlainObject } from 'lodash';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { NodeContext } from '../code.model';
import { ValidNode } from '../create-ts-compiler/canvas-utils';
import { round } from '../figma-code-map/details/utils-and-reset';
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

/**
 * Include in T those types that are assignable to U
 */
// type Include<T, U> = T extends U ? T : never;

export function addJss<T extends keyof TypographyStyle /* Include<keyof CSSStyleDeclaration, string> */>(
  styles: Partial<TypographyStyle>,
  name: T,
  ...value: (string | [number, CssUnit] | number)[]
) {
  if (!value.length || (value.length === 1 && value == null)) {
    return;
  }
  const style = value.map(val =>
    val === 0
      ? 0
      : !Array.isArray(val)
      ? typeof val === 'number'
        ? round(val)
        : val.toString()
      : val[0] === 0
      ? 0
      : val[1] === 'px'
      ? round(val[0])
      : `${round(val[0])}${val[1]}`,
  );
  (styles as any)[name] = style.length === 1 && typeof style[0] === 'number' ? style[0] : style.join('');
}

const cssToFigmaTokenMap = {
  'background-color': 'fill',
};

export function addStyle<T extends keyof PropertiesHyphen>(
  context: NodeContext,
  node: ValidNode | StyledTextSegment,
  styles: Dict<DeclarationPlain>,
  name: T,
  ...values: (
    | NonNullable<PropertiesHyphen[T]>
    | [number, CssUnit]
    | [number, CssUnit, number]
    | number
    | Dict<NonNullable<PropertiesHyphen[T]> | [number, CssUnit] | [number, CssUnit, number] | number>
  )[]
) {
  for (const val of values) {
    if (val == null) return;
  }

  const { varNamesMap } = context.moduleContext.projectContext;
  const figmaTokenProp = cssToFigmaTokenMap[name as keyof typeof cssToFigmaTokenMap];
  if (
    varNamesMap &&
    figmaTokenProp &&
    (node as any)._tokens?.[figmaTokenProp] &&
    varNamesMap[(node as any)._tokens[figmaTokenProp]]
  ) {
    values = [`var(--${varNamesMap[(node as any)._tokens[figmaTokenProp]]})` as any];
  } else {
    values = values.filter(val => {
      if (Array.isArray(val)) val = val[0];
      return val != null && (typeof val !== 'number' || !isNaN(val));
    });
    if (!values.length) {
      return;
    }
  }

  styles[name] = mkDeclarationCss(
    name,
    mkValueCss(
      values.map(val => {
        if (isPlainObject(val)) {
          const [figmaTokenProp, value] = Object.entries(val)[0];
          val = value;
          if (varNamesMap) {
            if ((node as any)._tokens?.[figmaTokenProp] && varNamesMap[(node as any)._tokens[figmaTokenProp]]) {
              // When the unit is px but the variable is a raw number (no unit), we use a trick to make the browser interpret it with the unit.
              // src: https://stackoverflow.com/a/57666216/4053349
              const factor = (val as any)[2] || 1;
              const cssVal =
                Array.isArray(val) && (val as any)[1]
                  ? `calc(var(--${varNamesMap[(node as any)._tokens[figmaTokenProp]]}) * ${factor}${(val as any)[1]})`
                  : `var(--${varNamesMap[(node as any)._tokens[figmaTokenProp]]})`;
              return mkRawCss(cssVal);
            }
          }
        }
        return val === 0
          ? mkNumberCss(0)
          : !Array.isArray(val)
          ? cssOperators.includes(val as CssOperators)
            ? mkOperatorCss(val as CssOperators)
            : typeof val === 'number'
            ? mkNumberCss(val)
            : mkRawCss(val.toString())
          : mkDimensionCss(val[0] * (val[2] || 1), val[1]);
      }),
    ),
  );
}
