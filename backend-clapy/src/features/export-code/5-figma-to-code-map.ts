import { DeclarationPlain } from 'css-tree';
import { ts } from 'ts-morph';

import { Dict } from '../sb-serialize-preview/sb-serialize.model';
import { CodeContext, JsxOneOrMore } from './code.model';
import { AllNode, FlexNode } from './create-ts-compiler/canvas-utils';
import { backgroundFigmaToCode } from './figma-code-map/background';
import { borderFigmaToCode } from './figma-code-map/border';
import { borderRadiusFigmaToCode } from './figma-code-map/border-radius';
import { colorFigmaToCode } from './figma-code-map/color';
import { cursorFigmaToCode } from './figma-code-map/cursor';
import { rangeProps } from './figma-code-map/details/fonts-utils';
import {
  addCssRule,
  genClassName,
  mkClassAttr,
  mkHrefAttr,
  mkTag,
  mkTargetBlankAttr,
} from './figma-code-map/details/ts-ast-utils';
import { warnNode } from './figma-code-map/details/utils-and-reset';
import { flexFigmaToCode } from './figma-code-map/flex';
import { fontFigmaToCode } from './figma-code-map/font';
import { opacityFigmaToCode } from './figma-code-map/opacity';
import { overflowFigmaToCode } from './figma-code-map/overflow';

const { factory } = ts;

export function mapCommonStyles(context: CodeContext, node: AllNode, styles: Dict<DeclarationPlain>) {
  opacityFigmaToCode(context, node, styles);
  // blendMode
  // effects
}

export function mapTagStyles(context: CodeContext, node: FlexNode, styles: Dict<DeclarationPlain>) {
  const context2 = borderFigmaToCode(context, node, styles);
  flexFigmaToCode(context2, node, styles);
  borderRadiusFigmaToCode(context2, node, styles);
  backgroundFigmaToCode(context2, node, styles);
  cursorFigmaToCode(context2, node, styles);
  overflowFigmaToCode(context2, node, styles);
  // scaleFactor
  // reactions => hover, must make the diff with target node (check the type?)
}

function mapTextFragmentStyles(context: CodeContext, textSegment: StyledTextSegment, styles: Dict<DeclarationPlain>) {
  colorFigmaToCode(context, textSegment, styles);
  fontFigmaToCode(context, textSegment, styles);

  //   const {
  //     characters,
  //     start,
  //     end,
  //     fillStyleId,
  //     fills,
  //     fontName,
  //     fontSize,
  //     hyperlink,
  //     indentation,
  //     letterSpacing,
  //     lineHeight,
  //     listOptions,
  //     textCase,
  //     textDecoration,
  //     textStyleId,
  //   } = segment;
  // Inherited rules that are the same accross all segments can be moved to the container.
}

//--------------------------------------------------------------------------------
// Details for text - it is split into fragments, each applying its styles

function textNodeToAst(
  context: CodeContext,
  textSegment: StyledTextSegment,
  singleChild: boolean,
  parentStyles: Dict<DeclarationPlain>,
) {
  const styles: Dict<DeclarationPlain> = {};

  // Add text segment styles
  mapTextFragmentStyles(context, textSegment, styles);

  let ast: ts.JsxChild = factory.createJsxText(textSegment.characters, false);
  if (!singleChild) {
    const className = genClassName(context);
    addCssRule(context, className, Object.values(styles));
    const classAttr = mkClassAttr(className);
    if (textSegment.hyperlink) {
      if (textSegment.hyperlink.type === 'URL') {
        // hyperlink of type NODE not handled for now
        ast = mkTag('a', [classAttr, mkHrefAttr(textSegment.hyperlink.value), mkTargetBlankAttr()], [ast]);
      } else {
        warnNode(textSegment, 'Unsupported hyperlink of type node');
        ast = mkTag('span', [classAttr], [ast]);
      }
    } else {
      ast = mkTag('span', [classAttr], [ast]);
    }
  } else {
    Object.assign(parentStyles, styles);
  }
  return ast;
}

export function mapTextStyles(context: CodeContext, node: TextNode, styles: Dict<DeclarationPlain>): JsxOneOrMore {
  const textSegments: StyledTextSegment[] = node.getStyledTextSegments(rangeProps);
  return textSegments.map(segment => textNodeToAst(context, segment, textSegments.length === 1, styles));
}
