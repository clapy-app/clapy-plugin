import { DeclarationPlain } from 'css-tree';
import ts from 'typescript';

import { mapTagStyles, mapTextSegmentStyles, postMapStyles } from '../6-figma-to-code-map';
import { isEmptyObject } from '../../../common/general-utils';
import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { JsxOneOrMore, NodeContext } from '../code.model';
import { TextNode2, TextSegment2 } from '../create-ts-compiler/canvas-utils';
import { addStyle } from '../css-gen/css-factories-high';
import { stylesToList } from '../css-gen/css-type-utils';
import { escapeHTML } from './process-nodes-utils';
import {
  addCssRule,
  createClassAttrForClassNoOverride,
  createClassAttrForNode,
  getOrGenClassName,
  mkHrefAttr,
  mkNoReferrerAttr,
  mkTag,
  mkTargetBlankAttr,
  mkWrapHideAndTextOverrideAst,
} from './ts-ast-utils';
import { warnNode } from './utils-and-reset';

const { factory } = ts;

export function prepareStylesOnTextSegments(context: NodeContext, node: TextNode2, styles: Dict<DeclarationPlain>) {
  const textSegments: TextSegment2[] | undefined = node._textSegments;
  if (!textSegments?.length) return;

  if (!node._segmentsStyles) node._segmentsStyles = [];

  for (let i = 0; i < textSegments.length; i++) {
    const segment = textSegments[i];
    const segmentStyles: Dict<DeclarationPlain> = {};

    // Add text segment styles
    mapTextSegmentStyles(context, segment, segmentStyles, node);

    node._segmentsStyles[i] = segmentStyles;
  }

  const singleChild = textSegments.length === 1;
  const firstSegmentStyles = node._segmentsStyles[0];

  if (singleChild) {
    Object.assign(styles, firstSegmentStyles);
  } else {
    if (!firstSegmentStyles['font-size'] || !firstSegmentStyles['font-family']) {
      warnNode(
        node,
        'BUG No font-size or font-family to apply on the span wrapper. As of now, texts are supposed to always have those styles applied. To review.',
      );
    } else {
      const textWrapperStyles: Dict<DeclarationPlain> = {
        'font-size': firstSegmentStyles['font-size'],
        'font-family': firstSegmentStyles['font-family'],
      };
      // Cancel flex-shrink reset here since it prevents text wrap with this intermediate span.
      addStyle(context, node, textWrapperStyles, 'flex-shrink', 1);

      node.textInlineWrapperStyles = textWrapperStyles;
    }
  }

  const flexStyles: Dict<DeclarationPlain> = {};
  mapTagStyles(context, node, flexStyles);

  if (context.parentStyles && isEmptyObject(flexStyles)) {
    // TODO
    // I have concerns with this merge. `styles` also has common styles (opacity / transform) that we may not want to merge with the parent node.
    // A way to avoid that is to split into multiple styles objects. One common style obj (that we can check for emptiness similarly to flexStyles) and one text style obj.
    // Doing the merge would also require common styles to be empty.
    styles = postMapStyles(context, node, styles);
    Object.assign(context.parentStyles, styles);
    if (context.parentNode) {
      context.parentNode.styles = context.parentStyles;
    }
    node.textSkipStyles = true;
    // Later, here, we can add the code that will handle conflicts between parent node and child text nodes,
    // i.e. if the text node has different (and conflicting) styles with the parent (that potentially still need its style to apply to itself and/or siblings of the text node), then add an intermediate DOM node and apply the text style on it.
  } else {
    Object.assign(styles, flexStyles);
    postMapStyles(context, node, styles);
  }
}

export function genTextAst(node: TextNode2) {
  const { nodeContext: context, styles } = node;
  if (!context) throw new Error(`[genTextAst] node ${node.name} has no nodeContext`);
  if (!styles) throw new Error(`[genTextAst] node ${node.name} has no styles`);
  const { moduleContext } = context;
  const textSegments: TextSegment2[] | undefined = node._textSegments;
  const segmentsStyles = node._segmentsStyles;
  if (!textSegments?.length) return;
  if (!segmentsStyles?.length) return;

  const singleChild = textSegments.length === 1;
  let ast: JsxOneOrMore = [];

  // Prepare AST for each text segment
  for (let i = 0; i < textSegments.length; i++) {
    const segment = textSegments[i];
    const segmentStyles = segmentsStyles[i];
    let segAst: ts.JsxChild = factory.createJsxText(escapeHTML(segment.characters), false);

    if (!singleChild) {
      const styleDeclarations = stylesToList(segmentStyles);
      const attributes: ts.JsxAttribute[] = [];
      if (styleDeclarations.length) {
        const className = getOrGenClassName(moduleContext);
        addCssRule(context, className, styleDeclarations);
        attributes.push(createClassAttrForClassNoOverride(className));
      }
      if (segment.hyperlink) {
        if (segment.hyperlink.type === 'URL') {
          // hyperlink of type NODE not handled for now
          attributes.push(mkHrefAttr(segment.hyperlink.value), mkTargetBlankAttr(), mkNoReferrerAttr());
        } else {
          warnNode(segment, 'TODO Unsupported hyperlink of type node');
        }
      }
      segAst = mkTag('span', attributes, [segAst]);
    }

    ast.push(segAst);
  }

  // If multiple segments, surround with span to maintain the inline style
  if (!singleChild) {
    const attributes: ts.JsxAttribute[] = [];
    if (node.textInlineWrapperStyles) {
      const styleDeclarations = stylesToList(node.textInlineWrapperStyles);
      if (styleDeclarations.length) {
        const className = getOrGenClassName(moduleContext, undefined, 'labelWrapper');
        addCssRule(context, className, styleDeclarations);
        attributes.push(createClassAttrForClassNoOverride(className));
      }
    }
    ast = mkTag('span', attributes, ast);
  }

  // If node has styles to render, surround with a styled div
  if (!node.textSkipStyles) {
    const styleDeclarations = stylesToList(styles);
    let attributes: ts.JsxAttribute[] = [];
    if (styleDeclarations.length) {
      const className = getOrGenClassName(moduleContext, node);
      addCssRule(context, className, styleDeclarations);
      attributes.push(createClassAttrForNode(node));
    }
    ast = mkTag('div', attributes, Array.isArray(ast) ? ast : [ast]);
  }

  ast = mkWrapHideAndTextOverrideAst(context, ast, node);

  return ast;
}

export function createTextAst(context: NodeContext, node: TextNode2, styles: Dict<DeclarationPlain>) {
  prepareStylesOnTextSegments(context, node, styles);
  return genTextAst(node);
}
