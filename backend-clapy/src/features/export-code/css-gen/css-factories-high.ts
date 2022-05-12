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
 * Mapping CSS rule => Figma token (design tokens). Map here when a CSS rule should always use a given token.
 *
 * Exceptions happen, e.g. workarounds in specific situations where you want to apply tokens in that case only.
 * For such a situation, prefer the annotation syntax, e.g.:
 * `addStyle(context, node, styles, 'outline-offset', { borderWidth: [borderWidth, 'px', -1] });`
 * This example uses:
 * - an annotation: wrapping in an object with key borderWidth to indicate the CSS value should use the borderWidth design token
 * - The array syntax with 2+ elements, 1st being the value (number), 2nd the unit (e.g. px)
 * - A 3rd element in the array indicating a factor to apply on the value. This is important when using variables, because the calculation will be done dynamically by the browser from the variable value.
 *
 * This mapping can also be used with annotation keys when we need to check multiple tokens in specific situations.
 */
const cssToFigmaTokenMap: Dict<string | string[]> = {
  'background-color': 'fill',
  opacity: 'opacity',
  width: ['width', 'sizing'],
  height: ['height', 'sizing'],
  gap: ['itemSpacing', 'spacing'],
  paddingTop: ['paddingTop', 'spacing'],
  paddingRight: ['paddingRight', 'spacing'],
  paddingBottom: ['paddingBottom', 'spacing'],
  paddingLeft: ['paddingLeft', 'spacing'],
  borderRadiusTopLeft: ['borderRadiusTopLeft', 'borderRadius'],
  borderRadiusTopRight: ['borderRadiusTopRight', 'borderRadius'],
  borderRadiusBottomRight: ['borderRadiusBottomRight', 'borderRadius'],
  borderRadiusBottomLeft: ['borderRadiusBottomLeft', 'borderRadius'],
};

type StyleValue<T extends keyof PropertiesHyphen> =
  | NonNullable<PropertiesHyphen[T]>
  | [number, CssUnit]
  | [number, CssUnit, number]
  | number
  | Dict<NonNullable<PropertiesHyphen[T]> | [number, CssUnit] | [number, CssUnit, number] | number>;

export function addStyle<T extends keyof PropertiesHyphen>(
  context: NodeContext,
  node: ValidNode | StyledTextSegment,
  styles: Dict<DeclarationPlain>,
  name: T,
  ...values: StyleValue<T>[]
) {
  for (const val of values) {
    if (val == null) return;
  }

  const token = applyToken(context, node, name, values[0]);
  if (token) {
    values = [token as any];
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
          // Unwrap value from annotation object
          const [figmaTokenProp, value] = Object.entries(val)[0];
          val = value;

          const token = applyToken(context, node, figmaTokenProp, val);
          if (token) {
            return mkRawCss(token);
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

function applyToken<T extends keyof PropertiesHyphen>(
  context: NodeContext,
  node: ValidNode | StyledTextSegment,
  name: string,
  value: StyleValue<T>,
) {
  if (isPlainObject(value)) {
    // If the value is an object, it is treated as an annotation that has priority over the general
    // CSS-to-token mapping.
    return;
  }
  const { varNamesMap } = context.moduleContext.projectContext;
  const figmaTokenProp = cssToFigmaTokenMap[name as keyof typeof cssToFigmaTokenMap] || name;
  const varName = getVarNameFromTokenNames(node, varNamesMap, figmaTokenProp);
  if (varName) {
    const valIsArray = Array.isArray(value);
    const applyUnit = valIsArray && !!(value as any)[1];
    const unit = applyUnit ? (value as any)[1] : undefined;
    const applyFactor = applyUnit || (valIsArray && !!(value as any)[2]);
    const factor = applyFactor ? (value as any)[2] || 1 : undefined;

    // With length, the unit must be specified. But as is, Figma tokens + Style Dictionary generate numbers alone in the variables, without the units.
    // Workaround: we use a trick with calc to indicate the browser the unit to apply.
    // Ideally, the unit should be included in the variable value itself (ticket for later?)
    return applyUnit
      ? `calc(var(--${varName}) * ${factor}${unit})`
      : applyFactor
      ? `calc(var(--${varName}) * ${factor})`
      : `var(--${varName})`;
  }
}

function getVarNameFromTokenNames(
  node: ValidNode | StyledTextSegment,
  varNamesMap: Dict<string> | undefined,
  tokenNames: string | string[] | undefined,
) {
  if (!varNamesMap || !tokenNames) return;
  if (!Array.isArray(tokenNames)) {
    tokenNames = [tokenNames];
  }
  for (const name of tokenNames) {
    if ((node as any)._tokens?.[name] && varNamesMap[(node as any)._tokens[name]]) {
      return varNamesMap[(node as any)._tokens[name]];
    }
  }
  return;
}

// Deprecated? Would addStyle work as a substitution?
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
