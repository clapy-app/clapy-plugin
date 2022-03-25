import { DeclarationPlain } from 'css-tree';

import { Dict, SceneNodeNoMethod, TextNodeNoMethod } from '../sb-serialize-preview/sb-serialize.model';
import { CodeContext } from './code.model';
import { FlexNode } from './create-ts-compiler/canvas-utils';
import { backgroundFigmaToCode } from './figma-code-map/background';
import { borderFigmaToCode } from './figma-code-map/border';
import { borderRadiusFigmaToCode } from './figma-code-map/border-radius';
import { colorFigmaToCode } from './figma-code-map/color';
import { cursorFigmaToCode } from './figma-code-map/cursor';
import { flexFigmaToCode } from './figma-code-map/flex';

export function mapCommonStyles(context: CodeContext, node: SceneNodeNoMethod, stylesMap: Dict<DeclarationPlain>) {}

export function mapTextStyles(context: CodeContext, node: TextNodeNoMethod, stylesMap: Dict<DeclarationPlain>) {
  colorFigmaToCode(context, node, stylesMap);
  // strokes (borders on FlexNode) has a different effect on text.
}

export function mapTagStyles(context: CodeContext, node: FlexNode, stylesMap: Dict<DeclarationPlain>) {
  const context2 = borderFigmaToCode(context, node, stylesMap);
  flexFigmaToCode(context2, node, stylesMap);
  borderRadiusFigmaToCode(context2, node, stylesMap);
  backgroundFigmaToCode(context2, node, stylesMap);
  cursorFigmaToCode(context2, node, stylesMap);
}
