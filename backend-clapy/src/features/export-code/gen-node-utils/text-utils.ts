import type { DeclarationPlain } from 'css-tree';

import { mapTagStyles, mapTextSegmentStyles, postMapStyles } from '../6-figma-to-code-map.js';
import { isEmptyObject } from '../../../common/general-utils.js';
import { flags } from '../../../env-and-config/app-config.js';
import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from '../code.model.js';
import type {
  ListBlock,
  ParagraphBlock,
  TextBlock,
  TextNode2,
  TextSegment2,
} from '../create-ts-compiler/canvas-utils.js';
import { ListType } from '../create-ts-compiler/canvas-utils.js';
import { addStyle } from '../css-gen/css-factories-high.js';
import { mkBlockCss, mkRawCss, mkRuleCss, mkSelectorCss, mkSelectorListCss } from '../css-gen/css-factories-low.js';
import { stylesToList } from '../css-gen/css-type-utils.js';
import type { FwAttr, FwNodeOneOrMore } from '../frameworks/framework-connectors.js';
import { getOrGenClassName } from './gen-unique-name-utils.js';
import { escapeHTMLSplitParagraphsNoSpacing, splitParagraphsWithSpacing } from './process-nodes-utils.js';
import { addCssRule, mkHtmlFullClass, mkIdAttribute } from './ts-ast-utils.js';
import { warnNode } from './utils-and-reset.js';
import type ts from 'typescript';

function mkListBlock(listType: ListType): ListBlock {
  return { paragraphBlocks: [], listType };
}

function mkParagraphBlock(): ParagraphBlock {
  return { textBlocks: [] };
}

function mkTextBlock(): TextBlock {
  return { segments: [], blockStyles: {} };
}

export function prepareStylesOnTextSegments(context: NodeContext, node: TextNode2, styles: Dict<DeclarationPlain>) {
  let textSegments: TextSegment2[] | undefined = node._textSegments;
  if (!textSegments?.length) return;

  const listBlocks: ListBlock[] = [];
  node._listBlocks = listBlocks;
  let latestListBlock: ListBlock | undefined = undefined;
  let latestParagraphBlock: ParagraphBlock | undefined = undefined;
  let latestTextBlock: TextBlock | undefined = undefined;

  // We restructure the segments to group by list, paragraph and text blocks. The Figma structure doesn't match the HTML needs, i.e. each segment can contain multiple paragraphs, and a paragraph can overlap with multiple segments.
  for (let i = 0; i < textSegments.length; i++) {
    const segment = textSegments[i];

    // In the segment, the text is split by new line (new paragraph with spacing and "same paragraph" without spacing)
    const blocksWithParagraphSpacing = splitParagraphsWithSpacing(segment.characters);
    for (let j = 0; j < blocksWithParagraphSpacing.length; j++) {
      const blockWithSpacing = blocksWithParagraphSpacing[j];

      // Create new paragraph block if \n detected or if this fragment is in a new list block.
      if (j >= 1 || !latestParagraphBlock) {
        const segIndex = latestListBlock ? i + 1 : i;
        let listTypeRaw = textSegments[segIndex]?.listOptions?.type;
        if (!latestListBlock || (listTypeRaw && listTypeRaw !== textSegments[segIndex - 1].listOptions?.type)) {
          const listType =
            listTypeRaw === 'ORDERED'
              ? ListType.ORDERED
              : listTypeRaw === 'UNORDERED'
              ? ListType.UNORDERED
              : ListType.NONE;
          latestListBlock = mkListBlock(listType);
          listBlocks.push(latestListBlock);
        }

        latestParagraphBlock = mkParagraphBlock();
        latestListBlock.paragraphBlocks.push(latestParagraphBlock);
        latestTextBlock = undefined;
      }

      const blocksNoParagraphSpacing = escapeHTMLSplitParagraphsNoSpacing(blockWithSpacing);
      for (let k = 0; k < blocksNoParagraphSpacing.length; k++) {
        const block = blocksNoParagraphSpacing[k];

        // Detect new blocks: delimited by a new line. Otherwise, it's a new segment, changing the style into the same block.
        if (j >= 1 || k >= 1 || !latestTextBlock) {
          latestTextBlock = mkTextBlock();
          latestParagraphBlock.textBlocks.push(latestTextBlock);
        }
        const newSegment = {
          ...segment,
          characters: block,
        };
        latestTextBlock.segments.push(newSegment);
      }
    }
  }

  if (!listBlocks?.[0]?.paragraphBlocks?.[0]?.textBlocks?.[0]?.segments?.length) {
    throw new Error(`BUG node ${node.name} has a text block without any text found.`);
  }

  // Generate styles for each segment. Loop over lists, paragraphs and text blocks. We use the indexes because the position in the list impacts how styles are applied.
  let isFirstBlock = true;
  for (let i = 0; i < listBlocks.length; i++) {
    const listBlock = listBlocks[i];
    const { paragraphBlocks } = listBlock;

    for (let j = 0; j < paragraphBlocks.length; j++) {
      const pBlock = paragraphBlocks[j];
      const { textBlocks } = pBlock;

      for (let k = 0; k < textBlocks.length; k++) {
        const block = textBlocks[k];

        // Add the space between two paragraphs. Between p1 and p2, if they are both lists (regardless of whether they are in the same list or 2 different lists), the list spacing applies. Otherwise, paragraph spacing is used.
        if (!isFirstBlock) {
          if (k === 0) {
            const spacing =
              listBlock.listType !== ListType.NONE &&
              (j > 0 || (j === 0 && i > 0 && listBlocks[i - 1]?.listType !== ListType.NONE))
                ? node.listSpacing
                : node.paragraphSpacing;
            addStyle(context, node, block.blockStyles, 'margin-top', [spacing, 'px']);
          }
        } else {
          isFirstBlock = false;
        }

        for (const segment of block.segments) {
          const segmentStyles: Dict<DeclarationPlain> = {};

          // Add text segment styles
          mapTextSegmentStyles(context, segment, segmentStyles, node);

          segment._segmentStyles = segmentStyles;
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
            textWrapperStyles['font-size'] = block.segments[smallestFontSizeIndex]._segmentStyles['font-size'];
            textWrapperStyles['font-family'] = firstSegmentStyles['font-family'];
            // Cancel flex-shrink reset here since it prevents text wrap with this intermediate span.
            addStyle(context, node, textWrapperStyles, 'flex-shrink', 1);

            block.textInlineWrapperStyles = textWrapperStyles;
          }
        }
      }
    }
  }

  if (
    listBlocks.length === 1 &&
    listBlocks[0].listType === ListType.NONE &&
    listBlocks[0].paragraphBlocks.length === 1 &&
    listBlocks[0].paragraphBlocks[0].textBlocks.length === 1
  ) {
    const tb = listBlocks[0].paragraphBlocks[0].textBlocks[0];
    Object.assign(styles, tb.blockStyles);
    tb.blockStyles = {};
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

export function genTextAst<T extends boolean>(
  node: TextNode2,
  isJsExprAllowed: T,
): T extends true
  ? FwNodeOneOrMore | ts.BinaryExpression | ts.ConditionalExpression | undefined
  : FwNodeOneOrMore | undefined {
  const { nodeContext: context, styles } = node;
  if (!context) throw new Error(`[genTextAst] node ${node.name} has no nodeContext`);
  if (!styles) throw new Error(`[genTextAst] node ${node.name} has no styles`);
  const { moduleContext } = context;
  const { fwConnector, extraConfig } = moduleContext.projectContext;
  const listBlocks = node._listBlocks;
  if (!listBlocks?.length) return;

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

  let allListBlocksASTs: FwNodeOneOrMore | undefined = [];

  // list blocks correspond to a <ul>, <ol> or nothing if no list.
  for (const listBlock of listBlocks) {
    let listBlockASTs: FwNodeOneOrMore | undefined = [];

    // paragraphs correspond to a <li> or nothing if no list.
    for (const paragraphBlock of listBlock.paragraphBlocks) {
      let paragraphBlockASTs: FwNodeOneOrMore | undefined = [];

      // blocks correspond to the parent div or span around the text, inside the list if any.
      for (const block of paragraphBlock.textBlocks) {
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
        push(paragraphBlockASTs, segmentASTs);
      }

      // Wrap paragraph in <li> if we are in a list
      if (listBlock.listType !== ListType.NONE) {
        paragraphBlockASTs = fwConnector.wrapNode(paragraphBlockASTs, 'li', []);
      }

      push(listBlockASTs, paragraphBlockASTs);
    }

    // Wrap paragraphs in <ul> or <ol> if we are in a list
    if (listBlock.listType !== ListType.NONE) {
      listBlockASTs = fwConnector.wrapNode(listBlockASTs, listBlock.listType === ListType.ORDERED ? 'ol' : 'ul', []);
    }

    push(allListBlocksASTs, listBlockASTs);
  }

  if (textBlockWrapperStyleAttributes) {
    allListBlocksASTs = fwConnector.wrapNode(allListBlocksASTs, 'div', textBlockWrapperStyleAttributes);
  }

  const blockASTs2 = fwConnector.wrapHideAndTextOverride(context, allListBlocksASTs, node, isJsExprAllowed);

  return blockASTs2;
}

export function genInputPlaceholderStyles(context: NodeContext, node: TextNode2) {
  const { moduleContext } = context;
  const segmentStyles = node._listBlocks?.[0]?.paragraphBlocks?.[0]?.textBlocks?.[0]?.segments?.[0]._segmentStyles;
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
