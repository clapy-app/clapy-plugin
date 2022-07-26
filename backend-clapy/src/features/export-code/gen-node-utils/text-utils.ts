import type { DeclarationPlain } from 'css-tree';
import ts from 'typescript';

import { mapTagStyles, mapTextSegmentStyles, postMapStyles } from '../6-figma-to-code-map.js';
import { isEmptyObject } from '../../../common/general-utils.js';
import { flags } from '../../../env-and-config/app-config.js';
import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { JsxOneOrMore, NodeContext } from '../code.model.js';
import type { TextNode2, TextSegment2 } from '../create-ts-compiler/canvas-utils.js';
import { addStyle } from '../css-gen/css-factories-high.js';
import { stylesToList } from '../css-gen/css-type-utils.js';
import { getOrGenClassName } from './gen-unique-name-utils.js';
import { escapeHTML } from './process-nodes-utils.js';
import {
  addCssRule,
  createClassAttrForClassNoOverride,
  createClassAttrForNode,
  mkHrefAttr,
  mkHtmlFullClass,
  mkIdAttribute,
  mkNoReferrerAttr,
  mkTag,
  mkTargetBlankAttr,
  mkWrapHideAndTextOverrideAst,
} from './ts-ast-utils.js';
import { warnNode } from './utils-and-reset.js';

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

  let htmlClass = node.htmlClass;

  const singleChild = textSegments.length === 1;

  let textBlockStyleAttributes: ts.JsxAttribute[] | undefined = undefined;
  let textSpanWrapperAttributes: ts.JsxAttribute[] | undefined = undefined;

  // The attributes are prepared from parent to children. We need this order for `bemClass` to list classes in the correct order.
  // But the AST nodes are wrapped from child to parent. We need this order to do the wrapping well.
  // So the process is split in 2 steps: prepare the attributes, then generate & wrap the AST.

  // Text block wrapper
  // If node has styles to render, surround with a styled div
  if (!node.textSkipStyles) {
    const styleDeclarations = stylesToList(styles);
    let attributes: ts.JsxAttribute[] = [];
    if (flags.writeFigmaIdOnNode) attributes.push(mkIdAttribute(node.id));
    if (styleDeclarations.length) {
      const className = getOrGenClassName(moduleContext, node);
      htmlClass = mkHtmlFullClass(context, className, htmlClass);
      addCssRule(context, className, styleDeclarations, node);
      attributes.push(createClassAttrForNode(node, htmlClass));
    }
    textBlockStyleAttributes = attributes;
  }

  // Text span wrapper
  // If multiple segments, surround with span to maintain the inline style
  if (!singleChild) {
    const attributes: ts.JsxAttribute[] = [];
    if (node.textInlineWrapperStyles) {
      const styleDeclarations = stylesToList(node.textInlineWrapperStyles);
      if (styleDeclarations.length) {
        const className = getOrGenClassName(moduleContext, undefined, 'labelWrapper');
        htmlClass = mkHtmlFullClass(context, className, htmlClass);
        addCssRule(context, className, styleDeclarations, node);
        attributes.push(createClassAttrForClassNoOverride(htmlClass));
      }
    }
    if (flags.writeFigmaIdOnNode && node.textSkipStyles) attributes.push(mkIdAttribute(node.id));
    textSpanWrapperAttributes = attributes;
  }

  let ast: JsxOneOrMore | undefined = [];

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
        let htmlClass2 = mkHtmlFullClass(context, className, htmlClass);
        addCssRule(context, className, styleDeclarations, node, true);
        attributes.push(createClassAttrForClassNoOverride(htmlClass2));
      }
      let useAnchor = false;
      if (segment.hyperlink) {
        if (segment.hyperlink.type === 'URL') {
          // hyperlink of type NODE not handled for now
          attributes.push(mkHrefAttr(segment.hyperlink.value), mkTargetBlankAttr(), mkNoReferrerAttr());
          useAnchor = true;
        } else {
          warnNode(segment, 'TODO Unsupported hyperlink of type node');
        }
      }
      segAst = mkTag(useAnchor ? 'a' : 'span', attributes, [segAst]);
    }

    ast.push(segAst);
  }

  if (textSpanWrapperAttributes) {
    ast = mkTag('span', textSpanWrapperAttributes, ast);
  }

  if (textBlockStyleAttributes) {
    ast = mkTag('div', textBlockStyleAttributes, Array.isArray(ast) ? ast : [ast]);
  }

  ast = mkWrapHideAndTextOverrideAst(context, ast, node);

  return ast;
}

export function createTextAst(context: NodeContext, node: TextNode2, styles: Dict<DeclarationPlain>) {
  prepareStylesOnTextSegments(context, node, styles);
  return genTextAst(node);
}
