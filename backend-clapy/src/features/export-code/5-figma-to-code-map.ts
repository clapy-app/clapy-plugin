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
  mkNoReferrerAttr,
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
import { textNodePatchesFigmaToCode } from './figma-code-map/text-node-patches';
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
  mapTagLayoutStyles(context, node, styles);
  if (!context.outerLayoutOnly) {
    mapTagUIStyles(context, node, styles);
  }
}

// Styles applying "outside" the component and/or impacting the component independently of how the component is designed
function mapTagLayoutStyles(context2: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  zindexFigmaToCode(context2, node, styles);
  flexFigmaToCode(context2, node, styles);
  positionAbsoluteFigmaToCode(context2, node, styles);
}

// Styles that are the responsibility of the component, typically the look and feel.
function mapTagUIStyles(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  borderFigmaToCode(context, node, styles);
  borderRadiusFigmaToCode(context, node, styles);
  backgroundFigmaToCode(context, node, styles);
  cursorFigmaToCode(context, node, styles);
  overflowFigmaToCode(context, node, styles);
  borderBoxFigmaToCode(context, node, styles);
  effectsFigmaToCode(context, node, styles);
  maskFigmaToCode(context, node, styles);
  textNodePatchesFigmaToCode(context, node, styles);
  return context;
}

function mapTextFragmentStyles(
  context: NodeContext,
  textSegment: StyledTextSegment,
  styles: Dict<DeclarationPlain>,
  node: TextNode2,
) {
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

interface StylesRef {
  styles?: Dict<DeclarationPlain>;
}

function textNodeToAst(
  context: NodeContext,
  textSegment: StyledTextSegment,
  parentStyles: Dict<DeclarationPlain>,
  node: TextNode2,
  firstChildStylesRef: StylesRef,
) {
  const styles: Dict<DeclarationPlain> = {};
  const singleChild = node._textSegments?.length === 1;

  // Add text segment styles
  mapTextFragmentStyles(context, textSegment, styles, node);

  let ast: ts.JsxChild = factory.createJsxText(escapeHTML(textSegment.characters), false);
  if (!singleChild) {
    const className = genClassName(context);
    addCssRule(context, className, stylesToList(styles));
    firstChildStylesRef.styles = styles;
    const classAttr = mkClassAttr(className);
    if (textSegment.hyperlink) {
      if (textSegment.hyperlink.type === 'URL') {
        // hyperlink of type NODE not handled for now
        ast = mkTag(
          'a',
          [classAttr, mkHrefAttr(textSegment.hyperlink.value), mkTargetBlankAttr(), mkNoReferrerAttr()],
          [ast],
        );
      } else {
        warnNode(textSegment, 'TODO Unsupported hyperlink of type node');
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

export function mapTextStyles(
  context: NodeContext,
  node: TextNode2,
  styles: Dict<DeclarationPlain>,
): JsxOneOrMore | undefined {
  const textSegments: StyledTextSegment[] | undefined = node._textSegments;
  if (!textSegments) return;
  const firstChildStylesRef: StylesRef = {};
  let ast: ts.JsxChild[] | ts.JsxElement = textSegments.map(segment =>
    textNodeToAst(context, segment, styles, node, firstChildStylesRef),
  );
  // If there are multiple text segments, we wrap in a span to:
  // - preserve the inline, including spaces between text segments
  // - make its positioning easier, e.g. vertically centered in a flex container
  if (firstChildStylesRef.styles) {
    // If we have the styles of the first child, it means we have more than one text fragments, so we should wrap.
    // And we can use it to extract the font-family and font-size, to apply on the wrapper.
    // The reason why we need to apply those is that an inline wrapper's layout is impacted by those styles (e.g. it changes the baseline location, and potentially other things).
    let classAttr: ts.JsxAttribute | undefined = undefined;
    if (firstChildStylesRef.styles['font-size'] || firstChildStylesRef.styles['font-family']) {
      const wrapperStyles: Dict<DeclarationPlain> = {
        'font-size': firstChildStylesRef.styles['font-size'],
        'font-family': firstChildStylesRef.styles['font-family'],
      };
      const className = genClassName(context, undefined, undefined, 'labelWrapper');
      addCssRule(context, className, stylesToList(wrapperStyles));
      classAttr = mkClassAttr(className);
    } else {
      warnNode(
        node,
        'BUG No font-size or font-family to apply on the span wrapper. As of now, texts are supposed to always have those styles applied. To review.',
      );
    }
    ast = mkTag('span', classAttr ? [classAttr] : [], ast);
  }
  return ast;
}
