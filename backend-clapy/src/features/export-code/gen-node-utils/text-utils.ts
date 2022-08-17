import type { DeclarationPlain } from 'css-tree';

import { mapTagStyles, mapTextSegmentStyles, postMapStyles } from '../6-figma-to-code-map.js';
import { isEmptyObject } from '../../../common/general-utils.js';
import { flags } from '../../../env-and-config/app-config.js';
import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from '../code.model.js';
import type { TextBlock, TextNode2, TextSegment2 } from '../create-ts-compiler/canvas-utils.js';
import { addStyle } from '../css-gen/css-factories-high.js';
import { mkBlockCss, mkRawCss, mkRuleCss, mkSelectorCss, mkSelectorListCss } from '../css-gen/css-factories-low.js';
import { stylesToList } from '../css-gen/css-type-utils.js';
import type { FwAttr, FwNodeOneOrMore } from '../frameworks/framework-connectors.js';
import { getOrGenClassName } from './gen-unique-name-utils.js';
import { escapeHTMLSplitParagraphsNoSpacing, splitParagraphsWithSpacing } from './process-nodes-utils.js';
import { addCssRule, mkHtmlFullClass, mkIdAttribute } from './ts-ast-utils.js';
import { warnNode } from './utils-and-reset.js';

function mkTextBlock(): TextBlock {
  return { segments: [], blockStyles: {} };
}

export function prepareStylesOnTextSegments(context: NodeContext, node: TextNode2, styles: Dict<DeclarationPlain>) {
  let textSegments: TextSegment2[] | undefined = node._textSegments;
  if (!textSegments?.length) return;

  const textBlocks: TextBlock[] = [mkTextBlock()];
  node._textBlocks = textBlocks;
  let latestTextBlock = textBlocks[0];

  // Split segments that contain line breaks
  for (let i = 0; i < textSegments.length; i++) {
    const segment = textSegments[i];
    const blocksNoParagraphSpacing = escapeHTMLSplitParagraphsNoSpacing(segment.characters);
    for (let j = 0; j < blocksNoParagraphSpacing.length; j++) {
      const blockNoSpacing = blocksNoParagraphSpacing[j];
      const blocksWithParagraphSpacing = splitParagraphsWithSpacing(blockNoSpacing);
      for (let k = 0; k < blocksWithParagraphSpacing.length; k++) {
        const block = blocksWithParagraphSpacing[k];
        const newSegment = {
          ...segment,
          characters: block,
        };
        if (j >= 1 || k >= 1) {
          latestTextBlock = mkTextBlock();
          textBlocks.push(latestTextBlock);
          if (k >= 1) {
            latestTextBlock.spacingAbove = true;
          }
        }
        latestTextBlock.segments.push(newSegment);
      }
    }
  }

  if (!textBlocks?.length || !textBlocks[0].segments.length) {
    throw new Error(`BUG node ${node.name} has a text block without any text found.`);
  }

  // Generate styles for each segment
  for (const block of textBlocks) {
    for (const segment of block.segments) {
      const segmentStyles: Dict<DeclarationPlain> = {};

      // Add text segment styles
      mapTextSegmentStyles(context, segment, segmentStyles, node);

      segment._segmentStyles = segmentStyles;
    }

    if (block.spacingAbove) {
      addStyle(context, node, block.blockStyles, 'margin-top', [node.paragraphSpacing, 'px']);
    }

    // Text wrapper styles in the block
    const singleChild = block.segments.length === 1;
    const firstSegmentStyles = block.segments[0]._segmentStyles;

    if (singleChild) {
      Object.assign(block.blockStyles, firstSegmentStyles);
      block.segments[0]._segmentStyles = {};
    } else {
      // Smallest font size for the inline wrapper
      const smallestFontSizeIndex = block.segments.reduce(
        (prevIndex, curr, index) => (block.segments[prevIndex].fontSize <= curr.fontSize ? prevIndex : index),
        0,
      );
      if (smallestFontSizeIndex == null || !firstSegmentStyles['font-family']) {
        warnNode(
          node,
          'BUG No font-size or font-family to apply on the span wrapper. As of now, texts are supposed to always have those styles applied. To review.',
        );
      } else {
        const textWrapperStyles: Dict<DeclarationPlain> = {};
        addStyle(context, node, textWrapperStyles, 'display', 'inline');
        textWrapperStyles['font-size'] = block.segments[smallestFontSizeIndex]._segmentStyles['font-size'];
        textWrapperStyles['font-family'] = firstSegmentStyles['font-family'];
        // Cancel flex-shrink reset here since it prevents text wrap with this intermediate span.
        addStyle(context, node, textWrapperStyles, 'flex-shrink', 1);

        block.textInlineWrapperStyles = textWrapperStyles;
      }
    }
  }

  if (textBlocks.length === 1) {
    Object.assign(styles, textBlocks[0].blockStyles);
    textBlocks[0].blockStyles = {};
  }

  const flexStyles: Dict<DeclarationPlain> = {};
  mapTagStyles(context, node, flexStyles);
  addStyle(context, node, flexStyles, 'flex-direction', 'column');

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
  const { fwConnector, extraConfig } = moduleContext.projectContext;
  const textBlocks = node._textBlocks;
  if (!textBlocks?.length) return;

  let htmlClass = node.htmlClass;

  let textBlockWrapperStyleAttributes: FwAttr[] | undefined = undefined;

  // The attributes are prepared from parent to children. We need this order for `bemClass` to list classes in the correct order.
  // But the AST nodes are wrapped from child to parent. We need this order to do the wrapping well.
  // So the process is split in 2 steps: prepare the attributes, then generate & wrap the AST.

  // Text block wrapper
  // If node has styles to render, surround with a styled div
  if (!node.textSkipStyles) {
    const styleDeclarations = stylesToList(styles);
    let attributes: FwAttr[] = [];
    if (flags.writeFigmaIdOnNode) attributes.push(mkIdAttribute(node.id));
    if (styleDeclarations.length) {
      const className = getOrGenClassName(moduleContext, node);
      htmlClass = mkHtmlFullClass(context, className, htmlClass);
      addCssRule(context, className, styleDeclarations, node);
      attributes.push(fwConnector.createClassAttribute(node, extraConfig, htmlClass));
    }
    textBlockWrapperStyleAttributes = attributes;
  }

  let blockASTs: FwNodeOneOrMore | undefined = [];

  for (const block of textBlocks) {
    const singleChild = block.segments.length === 1;
    let htmlClass2 = htmlClass;
    let textBlockStyleAttributes: FwAttr[] | undefined = undefined;
    let textSpanWrapperAttributes: FwAttr[] | undefined = undefined;

    const blockStyleDeclarations = stylesToList(block.blockStyles);
    if (blockStyleDeclarations.length) {
      const className = getOrGenClassName(moduleContext, undefined, 'textBlock');
      htmlClass2 = mkHtmlFullClass(context, className, htmlClass2);
      addCssRule(context, className, blockStyleDeclarations, node);
      if (!textBlockStyleAttributes) textBlockStyleAttributes = [];
      textBlockStyleAttributes.push(fwConnector.createClassAttrForClassNoOverride(htmlClass2, extraConfig));
    }

    let useAnchorSingleChild = false;
    if (singleChild) {
      const segment = block.segments[0];
      if (segment.hyperlink) {
        if (segment.hyperlink.type === 'URL') {
          if (!textBlockStyleAttributes) textBlockStyleAttributes = [];
          // hyperlink of type NODE not handled for now
          textBlockStyleAttributes.push(...fwConnector.createLinkAttributes(segment.hyperlink.value));
          useAnchorSingleChild = true;
        } else {
          warnNode(segment, 'TODO Unsupported hyperlink of type node');
        }
      }
    }

    // Text span wrapper
    // If multiple segments, surround with span to maintain the inline style
    if (!singleChild) {
      const attributes: FwAttr[] = [];
      if (block.textInlineWrapperStyles) {
        const styleDeclarations = stylesToList(block.textInlineWrapperStyles);
        if (styleDeclarations.length) {
          const className = getOrGenClassName(moduleContext, undefined, 'labelWrapper');
          htmlClass2 = mkHtmlFullClass(context, className, htmlClass2);
          addCssRule(context, className, styleDeclarations, node);
          attributes.push(fwConnector.createClassAttrForClassNoOverride(htmlClass2, extraConfig));
        }
      }
      if (flags.writeFigmaIdOnNode && node.textSkipStyles) attributes.push(mkIdAttribute(node.id));
      textSpanWrapperAttributes = attributes;
    }

    let segmentASTs: FwNodeOneOrMore | undefined = [];

    // Prepare AST for each text segment
    for (let i = 0; i < block.segments.length; i++) {
      const segment = block.segments[i];
      const segmentStyles = segment._segmentStyles;
      let segAst: FwNodeOneOrMore = fwConnector.createText(segment.characters);

      if (!singleChild) {
        const styleDeclarations = stylesToList(segmentStyles);
        const attributes: FwAttr[] = [];
        if (styleDeclarations.length) {
          const className = getOrGenClassName(moduleContext);
          const htmlClass3 = mkHtmlFullClass(context, className, htmlClass2);
          addCssRule(context, className, styleDeclarations, node, true);
          attributes.push(fwConnector.createClassAttrForClassNoOverride(htmlClass3, extraConfig));
        }
        let useAnchor = false;
        if (segment.hyperlink) {
          if (segment.hyperlink.type === 'URL') {
            // hyperlink of type NODE not handled for now
            attributes.push(...fwConnector.createLinkAttributes(segment.hyperlink.value));
            useAnchor = true;
          } else {
            warnNode(segment, 'TODO Unsupported hyperlink of type node');
          }
        }
        segAst = fwConnector.wrapNode(segAst, useAnchor ? 'a' : 'span', attributes);
      }

      push(segmentASTs, segAst);
    }

    if (textSpanWrapperAttributes) {
      segmentASTs = fwConnector.wrapNode(segmentASTs, 'span', textSpanWrapperAttributes);
    }

    if (textBlockStyleAttributes) {
      segmentASTs = fwConnector.wrapNode(segmentASTs, useAnchorSingleChild ? 'a' : 'div', textBlockStyleAttributes);
    }

    // Wrap with blocks here
    push(blockASTs, segmentASTs);
  }

  if (textBlockWrapperStyleAttributes) {
    blockASTs = fwConnector.wrapNode(blockASTs, 'div', textBlockWrapperStyleAttributes);
  }

  blockASTs = fwConnector.wrapHideAndTextOverride(context, blockASTs, node, false);

  return blockASTs;
}

export function createTextAst(context: NodeContext, node: TextNode2, styles: Dict<DeclarationPlain>) {
  prepareStylesOnTextSegments(context, node, styles);
  return genTextAst(node);
}

export function genInputPlaceholderStyles(context: NodeContext, node: TextNode2) {
  const { moduleContext } = context;
  const segmentStyles = node._textBlocks?.[0]?.segments?.[0]._segmentStyles;
  if (!segmentStyles?.length) return;

  const styleDeclarations = stylesToList(segmentStyles);
  if (styleDeclarations.length) {
    const { cssRules } = moduleContext;
    const selector = mkRawCss(`${context.selector}::placeholder`);
    const selectors = mkSelectorListCss([mkSelectorCss([selector])]);
    const block = mkBlockCss(styleDeclarations);
    let cssRule = mkRuleCss(selectors, block);
    cssRules.push(cssRule);
  }
}

function push<T>(array: T[], elements: T | T[]) {
  if (Array.isArray(elements)) {
    array.push(...elements);
  } else {
    array.push(elements);
  }
}
