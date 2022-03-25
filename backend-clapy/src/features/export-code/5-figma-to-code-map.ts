import { DeclarationPlain } from 'css-tree';

import { Dict } from '../sb-serialize-preview/sb-serialize.model';
import { CodeContext } from './code.model';
import { AllNode, FlexNode } from './create-ts-compiler/canvas-utils';
import { backgroundFigmaToCode } from './figma-code-map/background';
import { borderFigmaToCode } from './figma-code-map/border';
import { borderRadiusFigmaToCode } from './figma-code-map/border-radius';
import { colorFigmaToCode } from './figma-code-map/color';
import { cursorFigmaToCode } from './figma-code-map/cursor';
import { flexFigmaToCode } from './figma-code-map/flex';
import { fontFigmaToCode } from './figma-code-map/font';
import { opacityFigmaToCode } from './figma-code-map/opacity';
import { overflowFigmaToCode } from './figma-code-map/overflow';

export function mapCommonStyles(context: CodeContext, node: AllNode, styles: Dict<DeclarationPlain>) {
  opacityFigmaToCode(context, node, styles);
  // blendMode
  // effects
}

export function mapTextStyles(context: CodeContext, node: TextNode, styles: Dict<DeclarationPlain>) {
  colorFigmaToCode(context, node, styles);
  fontFigmaToCode(context, node, styles);
  // strokes (borders on FlexNode) has a different effect on text.
  // listSpacing
  // line height
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
