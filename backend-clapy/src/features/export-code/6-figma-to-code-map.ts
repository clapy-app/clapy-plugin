import type { DeclarationPlain } from 'css-tree';
import equal from 'fast-deep-equal';
import ts from 'typescript';

import { warnOrThrow } from '../../utils.js';
import type { Dict } from '../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from './code.model.js';
import { isInstanceContext } from './code.model.js';
import type { TextNode2, TextSegment2, ValidNode } from './create-ts-compiler/canvas-utils.js';
import { isText } from './create-ts-compiler/canvas-utils.js';
import { backgroundFigmaToCode, prepareBackgrounds } from './figma-code-map/background.js';
import { borderRadiusFigmaToCode } from './figma-code-map/border-radius.js';
import { borderFigmaToCode, prepareBorders } from './figma-code-map/border.js';
import { borderBoxFigmaToCode } from './figma-code-map/box-sizing.js';
import { colorFigmaToCode } from './figma-code-map/color.js';
import { cursorFigmaToCode } from './figma-code-map/cursor.js';
import { effectsFigmaToCode } from './figma-code-map/effects.js';
import { flexFigmaToCode } from './figma-code-map/flex.js';
import { fontFigmaToCode } from './figma-code-map/font.js';
import { maskFigmaToCode } from './figma-code-map/mask.js';
import { opacityFigmaToCode } from './figma-code-map/opacity.js';
import { overflowFigmaToCode } from './figma-code-map/overflow.js';
import { positionAbsoluteFigmaToCode } from './figma-code-map/position-absolute.js';
import { textNodePatchesFigmaToCode } from './figma-code-map/text-node-patches.js';
import { postTransform, transformFigmaToCode } from './figma-code-map/transform.js';
import { zindexFigmaToCode } from './figma-code-map/zindex.js';

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
  if (isInstanceContext(context) && !isText(node)) {
    // On the instance, only keep the styles different from the next intermediate component.
    const nextIntermediateNode = context.intermediateNodes[1];
    if (!nextIntermediateNode) {
      throw new Error(
        `BUG? context of instance node ${node.name} has undefined nextIntermediateNode (intermediateNodes[1])`,
      );
    }
    const compStyles = nextIntermediateNode.styles;
    if (!compStyles && nextIntermediateNode.visible) {
      warnOrThrow(`node ${nextIntermediateNode.name} has no styles attached when checking its instance.`);
    }
    if (compStyles) {
      const instanceStyles: Dict<DeclarationPlain> = {};
      for (const [ruleName, astValue] of Object.entries(styles)) {
        const compValue = compStyles[ruleName];
        if (!equal(astValue, compValue)) {
          instanceStyles[ruleName] = astValue;
        }
      }
      styles = instanceStyles;
    }
  }
  node.styles = styles;
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
  prepareBorders(context, node, styles);
  prepareBackgrounds(context, node, styles);
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

export function mapTextSegmentStyles(
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
