import { DeclarationPlain } from 'css-tree';
import equal from 'fast-deep-equal';
import ts from 'typescript';

import { Dict } from '../sb-serialize-preview/sb-serialize.model';
import { isInstanceContext, JsxOneOrMore, NodeContext } from './code.model';
import { TextNode2, TextSegment2, ValidNode } from './create-ts-compiler/canvas-utils';
import { addStyle } from './css-gen/css-factories-high';
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
  createClassAttrForClassNoOverride,
  getOrGenClassName,
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
import { postTransform, transformFigmaToCode } from './figma-code-map/transform';
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

export function postMapStyles(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  postTransform(context, node, styles);
  if (isInstanceContext(context)) {
    // 2) On the instance, only keep the styles different from the component.
    // console.log(context.nodeOfComp.name, '<=', node.name);
    const compStyles = context.nodeOfComp.styles;
    // console.log('Comp styles:', context.nodeOfComp.styles, '-- inst:', styles);
    if (compStyles) {
      const instanceStyles: Dict<DeclarationPlain> = {};
      for (const [ruleName, astValue] of Object.entries(styles)) {
        const compValue = compStyles[ruleName];
        if (!equal(astValue, compValue)) {
          instanceStyles[ruleName] = astValue;
        }
      }
      return instanceStyles;
    }
  } else if (context.moduleContext.isComponent) {
    // 1) save the component styles for 2) above.
    node.styles = styles;
  }
  return styles;
}

// Styles applying "outside" the component and/or impacting the component independently of how the component is designed
function mapTagLayoutStyles(context2: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  zindexFigmaToCode(context2, node, styles);
  positionAbsoluteFigmaToCode(context2, node, styles);
  flexFigmaToCode(context2, node, styles);
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

function mapTextSegmentStyles(
  context: NodeContext,
  textSegment: TextSegment2,
  styles: Dict<DeclarationPlain>,
  node: TextNode2,
) {
  colorFigmaToCode(context, textSegment, styles, node);
  fontFigmaToCode(context, textSegment, styles, node);

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
// Details for text - it is split into segments, each applying its styles

interface StylesRef {
  styles?: Dict<DeclarationPlain>;
}

function textNodeToAst(
  context: NodeContext,
  textSegment: TextSegment2,
  parentStyles: Dict<DeclarationPlain>,
  node: TextNode2,
  firstChildStylesRef: StylesRef,
) {
  const { moduleContext } = context;
  const styles: Dict<DeclarationPlain> = {};
  const singleChild = node._textSegments?.length === 1;

  // Add text segment styles
  mapTextSegmentStyles(context, textSegment, styles, node);

  if (!firstChildStylesRef.styles) {
    firstChildStylesRef.styles = styles;
  }

  let ast: ts.JsxChild = factory.createJsxText(escapeHTML(textSegment.characters), false);
  if (!singleChild) {
    const className = getOrGenClassName(moduleContext);
    addCssRule(context, className, stylesToList(styles));
    const classAttr = createClassAttrForClassNoOverride(className);
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
  const { moduleContext } = context;
  const textSegments: StyledTextSegment[] | undefined = node._textSegments;
  if (!textSegments) return;
  const firstChildStylesRef: StylesRef = {};
  const singleChild = textSegments?.length === 1;
  let ast: ts.JsxChild[] | ts.JsxElement = textSegments.map(segment =>
    textNodeToAst(context, segment, styles, node, firstChildStylesRef),
  );

  // TODO Add Figma tokens text rules here to a common style.
  // Merge with wrapperStyles?
  // If any rule, should apply to both single and multiple children.

  // If there are multiple text segments, we wrap in a span to:
  // - preserve the inline, including spaces between text segments
  // - make its positioning easier, e.g. vertically centered in a flex container
  if (!singleChild) {
    if (!firstChildStylesRef.styles) {
      throw new Error(`BUG Multiple text segments, but firstChildStylesRef.styles is undefined.`);
    }
    // If we have the styles of the first child, it means we have more than one text segments, so we should wrap.
    // And we can use it to extract the font-family and font-size, to apply on the wrapper.
    // The reason why we need to apply those is that an inline wrapper's layout is impacted by those styles (e.g. it changes the baseline location, and potentially other things).
    let classAttr: ts.JsxAttribute | undefined = undefined;
    if (firstChildStylesRef.styles['font-size'] || firstChildStylesRef.styles['font-family']) {
      const wrapperStyles: Dict<DeclarationPlain> = {
        'font-size': firstChildStylesRef.styles['font-size'],
        'font-family': firstChildStylesRef.styles['font-family'],
      };
      // Cancel flex-shrink reset here since it prevents text wrap with this intermediate span.
      addStyle(context, node, wrapperStyles, 'flex-shrink', 1);
      const className = getOrGenClassName(moduleContext, undefined, 'labelWrapper');
      addCssRule(context, className, stylesToList(wrapperStyles));
      classAttr = createClassAttrForClassNoOverride(className);
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
