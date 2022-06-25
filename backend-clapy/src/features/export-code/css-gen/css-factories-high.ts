import { TypographyStyle } from '@mui/material';
import { DeclarationPlain, Raw, ValuePlain } from 'css-tree';
import { PropertiesHyphen } from 'csstype';
import equal from 'fast-deep-equal';
import { isPlainObject } from 'lodash';

import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { isInstanceContext, NodeContext } from '../code.model';
import { isText, ValidNode } from '../create-ts-compiler/canvas-utils';
import { round } from '../gen-node-utils/utils-and-reset';
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
const cssToFigmaTokenMap: Dict<string | (string | [string, string])[]> = {
  'background-color': 'fill',
  color: 'fill',
  opacity: 'opacity',
  width: ['width', 'sizing'],
  height: ['height', 'sizing'],
  gap: ['itemSpacing', 'spacing'],
  // Special format for cases when a token has multiple keys, e.g. typography has fontSize, fontFamily...
  'font-size': [['typography', 'fontSize'], 'fontSizes'],
  fontFamily: [['typography', 'fontFamily'], 'fontFamilies'], // Special case because we need fallback fonts
  'font-weight': [['typography', 'fontWeight'], 'fontWeights'],
  'line-height': [['typography', 'lineHeight'], 'lineHeights'],
  // 'paragraphSpacing': [['typography', 'paragraphSpacing']], // TODO, seems to miss in generated CSS

  // Not CSS properties, but special keys we use to facilitate the binding to multiple tokens. The first found that is filled is used.
  paddingTop: ['paddingTop', 'spacing'],
  paddingRight: ['paddingRight', 'spacing'],
  paddingBottom: ['paddingBottom', 'spacing'],
  paddingLeft: ['paddingLeft', 'spacing'],
  borderRadiusTopLeft: ['borderRadiusTopLeft', 'borderRadius'],
  borderRadiusTopRight: ['borderRadiusTopRight', 'borderRadius'],
  borderRadiusBottomRight: ['borderRadiusBottomRight', 'borderRadius'],
  borderRadiusBottomLeft: ['borderRadiusBottomLeft', 'borderRadius'],
  boxShadow: ['boxShadow'],
};

type StyleValue<T extends keyof PropertiesHyphen> =
  | NonNullable<PropertiesHyphen[T]>
  | [number, CssUnit]
  | [number, CssUnit, number]
  | number
  | Dict<NonNullable<PropertiesHyphen[T]> | [number, CssUnit] | [number, CssUnit, number] | number>;

export function addStyle<T extends keyof PropertiesHyphen>(
  context: NodeContext,
  node: ValidNode,
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

  const newStyle = mkDeclarationCss(
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

  const inheritedStyle = getInheritedNodeStyle(context, name);
  if (isText(node) || !equal(newStyle, inheritedStyle)) {
    styles[name] = newStyle;
  }
}

export function applyToken<T extends keyof PropertiesHyphen>(
  context: NodeContext,
  node: ValidNode,
  name: string,
  value: StyleValue<T>,
) {
  if (isPlainObject(value)) {
    // If the value is an object, it is treated as an annotation that has priority over the general
    // CSS-to-token mapping.
    return;
  }
  const { varNamesMap } = context.moduleContext.projectContext;
  const tokenNames = cssToFigmaTokenMap[name as keyof typeof cssToFigmaTokenMap] || name;
  const varName = getVarNameFromTokenNames(context, node, varNamesMap, tokenNames);
  if (varName) {
    const valIsArray = Array.isArray(value);
    const applyFactor = valIsArray && !!(value as any)[2];
    const factor = applyFactor ? (value as any)[2] || 1 : undefined;

    const cssVar = varNameToCSSVar(varName);
    return applyFactor ? `calc(${cssVar} * ${factor})` : cssVar;
  }
}

function varNameToCSSVar(varName: string | number) {
  return `var(--${varName})`;
}

function getVarNameFromTokenNames(
  context: NodeContext,
  node: ValidNode,
  varNamesMap: Dict<string> | undefined,
  tokenNames: string | (string | [string, string])[] | undefined,
) {
  if (!varNamesMap || !tokenNames) return;
  if (!Array.isArray(tokenNames)) {
    tokenNames = [tokenNames];
  }
  for (let name of tokenNames) {
    let subKey: string | undefined = undefined;
    if (Array.isArray(name)) {
      [name, subKey] = name;
    }
    let tokenName = (node as any)._tokens?.[name];
    if (tokenName) {
      if (subKey) {
        tokenName = `${tokenName}.${subKey}`;
      }
      if (varNamesMap[tokenName]) {
        return varNamesMap[tokenName];
      }
    }
  }
}

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

/**
 *
 * @param context
 * @param node
 * @param styles
 * @param name
 * @param value A value to add a condition to reset. If `value` is defined, the rule `name` is reset only if the inherited CSS rule found has the value `value`. The filter only works if `value` is of type Raw in the CSS AST.
 */
export function resetStyleIfOverriding<T extends keyof PropertiesHyphen>(
  context: NodeContext,
  node: ValidNode,
  styles: Dict<DeclarationPlain>,
  name: keyof PropertiesHyphen,
  value?: StyleValue<T>,
) {
  if (intermediateNodesDefinedThisStyle(context, name, value)) {
    addStyle(context, node, styles, name, 'initial');
  }
}

function intermediateNodesDefinedThisStyle<T extends keyof PropertiesHyphen>(
  context: NodeContext,
  name: keyof PropertiesHyphen,
  value?: StyleValue<T>,
) {
  const style = getInheritedNodeStyle(context, name);
  if (style) {
    const inheritedValue = ((style.value as ValuePlain)?.children?.[0] as Raw)?.value;
    const isCSSReset = inheritedValue === 'initial';
    return !isCSSReset && (value == null || inheritedValue === value);
  }
  return false;
}

export function getInheritedNodeStyle(context: NodeContext, name: keyof PropertiesHyphen) {
  if (isInstanceContext(context)) {
    const inheritedStyles = getInheritedNodeStyles(context);
    return inheritedStyles?.[name];
  }
  return undefined;
}

function getInheritedNodeStyles(context: NodeContext) {
  if (isInstanceContext(context)) {
    if (!context.inheritedStyles) {
      const inheritedStyles: Dict<DeclarationPlain> = {};
      for (let i = context.intermediateNodes.length - 1; i >= 1; i--) {
        const style = context.intermediateNodes[i]?.styles;
        if (style) {
          Object.assign(inheritedStyles, style);
        }
      }
      context.inheritedStyles = inheritedStyles;
    }
    return context.inheritedStyles;
  }
  return undefined;
}

export function mergeWithInheritedStyles(context: NodeContext, styles: Dict<DeclarationPlain>) {
  const inheritedStyles = getInheritedNodeStyles(context);
  if (inheritedStyles) {
    return Object.assign({}, inheritedStyles, styles);
  } else {
    return styles;
  }
}
