import { DeclarationPlain } from 'css-tree';
import { ts } from 'ts-morph';

import { Dict } from '../sb-serialize-preview/sb-serialize.model';
import { JsxOneOrMore, NodeContext } from './code.model';
import { TextNode2, ValidNode } from './create-ts-compiler/canvas-utils';
import { stylesToList } from './css-gen/css-type-utils';
import { backgroundFigmaToCode } from './figma-code-map/background';
import { borderFigmaToCode } from './figma-code-map/border';
import { borderRadiusFigmaToCode } from './figma-code-map/border-radius';
import { borderBoxFigmaToCode } from './figma-code-map/box-sizing';
import { colorFigmaToCode } from './figma-code-map/color';
import { cursorFigmaToCode } from './figma-code-map/cursor';
import { escapeHTML } from './figma-code-map/details/process-nodes-utils';
import {
  addCssRule,
  genClassName,
  mkClassAttr,
  mkHrefAttr,
  mkTag,
  mkTargetBlankAttr,
} from './figma-code-map/details/ts-ast-utils';
import { warnNode } from './figma-code-map/details/utils-and-reset';
import { effectsFigmaToCode } from './figma-code-map/effects';
import { flexFigmaToCode } from './figma-code-map/flex';
import { fontFigmaToCode } from './figma-code-map/font';
import { maskFigmaToCode } from './figma-code-map/mask';
import { opacityFigmaToCode } from './figma-code-map/opacity';
import { overflowFigmaToCode } from './figma-code-map/overflow';
import { positionAbsoluteFigmaToCode } from './figma-code-map/position-absolute';
import { transformFigmaToCode } from './figma-code-map/transform';
import { zindexFigmaToCode } from './figma-code-map/zindex';

const { factory } = ts;

export function mapCommonStyles(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  // Remove later once we are sure global resets in CSS is a good idea.
  // addStyle(styles, 'display', 'flex');
  opacityFigmaToCode(context, node, styles);
  transformFigmaToCode(context, node, styles);
  // blendMode
  // effects
}

export function mapTagStyles(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  const context2 = borderFigmaToCode(context, node, styles);
  zindexFigmaToCode(context2, node, styles);
  flexFigmaToCode(context2, node, styles);
  positionAbsoluteFigmaToCode(context2, node, styles);
  borderRadiusFigmaToCode(context2, node, styles);
  backgroundFigmaToCode(context2, node, styles);
  cursorFigmaToCode(context2, node, styles);
  overflowFigmaToCode(context2, node, styles);
  borderBoxFigmaToCode(context2, node, styles);
  effectsFigmaToCode(context2, node, styles);
  maskFigmaToCode(context2, node, styles);
  return context2;
  // scaleFactor
  // reactions => hover, must make the diff with target node (check the type?)
}

function mapTextFragmentStyles(context: NodeContext, textSegment: StyledTextSegment, styles: Dict<DeclarationPlain>) {
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
  context: NodeContext,
  textSegment: StyledTextSegment,
  singleChild: boolean,
  parentStyles: Dict<DeclarationPlain>,
) {
  const styles: Dict<DeclarationPlain> = {};

  // Add text segment styles
  mapTextFragmentStyles(context, textSegment, styles);

  let ast: ts.JsxChild = factory.createJsxText(escapeHTML(textSegment.characters), false);
  if (!singleChild) {
    const className = genClassName(context);
    addCssRule(context, className, stylesToList(styles));
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

export function mapTextStyles(context: NodeContext, node: TextNode2, styles: Dict<DeclarationPlain>) {
  const textSegments: StyledTextSegment[] | undefined = node._textSegments;
  if (!textSegments) return;
  const ast: JsxOneOrMore = textSegments.map(segment =>
    textNodeToAst(context, segment, textSegments.length === 1, styles),
  );
  return ast;
}
