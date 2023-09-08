import type { DeclarationPlain } from 'css-tree';

import { mapTagStyles, mapTextSegmentStyles, postMapStyles } from '../6-figma-to-code-map.js';
import { isEmptyObject } from '../../../common/general-utils.js';
import { flags } from '../../../env-and-config/app-config.js';
import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from '../code.model.js';
import type {
  ListBlock,
  ParagraphBlock,
  RulePlainExtended,
  TextBlock,
  TextNode2,
  TextSegment2,
  ValidNode,
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
import { applyTruncate } from '../figma-code-map/text/truncate.js';

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
        // Special case: the empty segment after \n belongs to the next segment, e.g. for the style applied. This is important for list bullets and maybe empty paragraphs.
        const isEmptyTextAfterParagraphBreak =
          !block && j >= 1 && j === blocksWithParagraphSpacing.length - 1 && k === blocksNoParagraphSpacing.length - 1;
        const copiedSegment =
          isEmptyTextAfterParagraphBreak && i < textSegments.length - 1 ? textSegments[i + 1] : segment;

        const newSegment = {
          ...copiedSegment,
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
          if (listBlock.listType !== ListType.NONE && !listBlock.markerStyles) {
            listBlock.markerStyles = segmentStyles;
          }
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

  let textBlockWrapperStyleAttributes: FwAttr[] = [];
  let parentRule = node.rule;

  // The attributes are prepared from parent to children. We need this order for `bemClass` to list classes in the correct order.
  // But the AST nodes are wrapped from child to parent. We need this order to do the wrapping well.
  // So the process is split in 2 steps: prepare the attributes, then generate & wrap the AST.

  // Text block wrapper
  // If node has styles to render, surround with a styled div
  if (!node.textSkipStyles) {
    let attributes: FwAttr[] = [];

    ({ htmlClass, parentRule } = applyStyles(context, styles, htmlClass, attributes, node, parentRule, {
      attachClassToNode: true,
      fullClassOverrides: true,
    }));

    textBlockWrapperStyleAttributes = attributes;
  }

  let allListBlocksASTs: FwNodeOneOrMore | undefined = [];

  // list blocks correspond to a <ul>, <ol> or nothing if no list.
  for (const listBlock of listBlocks) {
    let listBlockASTs: FwNodeOneOrMore | undefined = [];

    let htmlClass2 = htmlClass;
    let parentRule2 = parentRule;

    let listBlockAttributes: FwAttr[] = [];
    if (listBlock.markerStyles) {
      let className: string | undefined;
      let skipAddClassAttribute = false;
      if (listBlock.markerStyles['font-size']) {
        const listStyles = {
          'font-size': listBlock.markerStyles['font-size'],
        };
        ({
          htmlClass: htmlClass2,
          parentRule: parentRule2,
          className,
        } = applyStyles(context, listStyles, htmlClass2, listBlockAttributes, node, parentRule2, {
          classBaseLabel: 'list',
        }));
        skipAddClassAttribute = true;
      }
      applyStyles(context, listBlock.markerStyles, htmlClass2, listBlockAttributes, node, parentRule2, {
        className,
        customSelector: '_class_ ::marker',
        skipAddClassAttribute,
        skipAssignRule: true,
      });
    }

    // paragraphs correspond to a <li> or nothing if no list.
    for (const paragraphBlock of listBlock.paragraphBlocks) {
      let paragraphBlockASTs: FwNodeOneOrMore | undefined = [];

      // blocks correspond to the parent div or span around the text, inside the list if any.
      for (const block of paragraphBlock.textBlocks) {
        const singleChild = block.segments.length === 1;
        let htmlClass3 = htmlClass2;
        let parentRule3 = parentRule2;
        let textBlockStyleAttributes: FwAttr[] = [];
        let textSpanWrapperAttributes: FwAttr[] = [];

        let useAnchorSingleChild = false;
        if (singleChild) {
          const segment = block.segments[0];
          if (segment.hyperlink) {
            if (segment.hyperlink.type === 'URL') {
              // hyperlink of type NODE not handled for now
              textBlockStyleAttributes.push(...fwConnector.createLinkAttributes(segment.hyperlink.value));
              useAnchorSingleChild = true;
              addStyle(context, node, block.blockStyles, 'display', 'block');
            } else {
              warnNode(segment, 'TODO Unsupported hyperlink of type node');
            }
          }
        }

        ({ htmlClass: htmlClass3, parentRule: parentRule3 } = applyStyles(
          context,
          block.blockStyles,
          htmlClass3,
          textBlockStyleAttributes,
          node,
          parentRule3,
          {
            classBaseLabel: 'textBlock',
          },
        ));

        // Text span wrapper
        // If multiple segments, surround with span to maintain the inline style
        if (applyTruncate(context, node, block) || !singleChild) {
          const attributes: FwAttr[] = [];
          if (block.textInlineWrapperStyles) {
            ({ htmlClass: htmlClass3, parentRule: parentRule3 } = applyStyles(
              context,
              block.textInlineWrapperStyles,
              htmlClass3,
              attributes,
              node,
              parentRule3,
              {
                classBaseLabel: 'labelWrapper',
              },
            ));
          }
          textSpanWrapperAttributes = attributes;
        }

        let segmentASTs: FwNodeOneOrMore = [];

        // Prepare AST for each text segment
        for (let i = 0; i < block.segments.length; i++) {
          const segment = block.segments[i];

          // Don't make empty spans
          if (!segment.characters) continue;

          const segmentStyles = segment._segmentStyles;
          let segAst: FwNodeOneOrMore = fwConnector.createText(segment.characters);

          if (!singleChild) {
            const attributes: FwAttr[] = [];

            applyStyles(context, segmentStyles, htmlClass3, attributes, node, parentRule3, {
              skipAssignRule: true,
            });

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
            segAst = fwConnector.wrapNode(context, segAst, useAnchor ? 'a' : 'span', attributes);
          }

          push(segmentASTs, segAst);
        }

        if (textSpanWrapperAttributes.length) {
          segmentASTs = fwConnector.wrapNode(context, segmentASTs, 'p', textSpanWrapperAttributes);
        } else if (!segmentASTs.length) {
          // If no content, leave an empty <p></p> to take the vertical space.
          // It will work thanks to a CSS rule applied to empty <p> in resets.
          // Inspiration: https://stackoverflow.com/a/66457550/4053349
          segmentASTs = fwConnector.wrapNode(context, segmentASTs, 'p', []);
        }

        if (textBlockStyleAttributes.length) {
          segmentASTs = fwConnector.wrapNode(
            context,
            segmentASTs,
            useAnchorSingleChild ? 'a' : 'div',
            textBlockStyleAttributes,
          );
        }

        // Wrap with blocks here
        push(paragraphBlockASTs, segmentASTs);
      }

      // Wrap paragraph in <li> if we are in a list
      if (listBlock.listType !== ListType.NONE) {
        paragraphBlockASTs = fwConnector.wrapNode(context, paragraphBlockASTs, 'li', []);
      }

      push(listBlockASTs, paragraphBlockASTs);
    }

    // Wrap paragraphs in <ul> or <ol> if we are in a list
    if (listBlock.listType !== ListType.NONE) {
      listBlockASTs = fwConnector.wrapNode(
        context,
        listBlockASTs,
        listBlock.listType === ListType.ORDERED ? 'ol' : 'ul',
        listBlockAttributes,
      );
    }

    push(allListBlocksASTs, listBlockASTs);
  }

  if (textBlockWrapperStyleAttributes.length) {
    allListBlocksASTs = fwConnector.wrapNode(context, allListBlocksASTs, 'div', textBlockWrapperStyleAttributes, true);
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

function applyStyles(
  context: NodeContext,
  styles: Dict<DeclarationPlain>,
  htmlClass: string | undefined,
  attributes: FwAttr[],
  node: ValidNode,
  parentRule: RulePlainExtended | undefined,
  options?: {
    attachClassToNode?: boolean;
    classBaseLabel?: string;
    fullClassOverrides?: boolean;
    skipAssignRule?: boolean;
    customSelector?: string;
    className?: string;
    skipAddClassAttribute?: boolean;
  },
) {
  let {
    attachClassToNode,
    classBaseLabel,
    fullClassOverrides,
    skipAssignRule,
    customSelector,
    className,
    skipAddClassAttribute,
  } = options || {};
  const { moduleContext } = context;
  const { fwConnector, extraConfig } = moduleContext.projectContext;
  const blockStyleDeclarations = stylesToList(styles);
  if (flags.writeFigmaIdOnNode && attachClassToNode && !node.idAttached && !skipAddClassAttribute)
    attributes.push(mkIdAttribute(node.id));
  if (blockStyleDeclarations.length) {
    const reuseClassName = !!className;
    if (!className) {
      className = getOrGenClassName(moduleContext, attachClassToNode ? node : undefined, classBaseLabel);
    }
    htmlClass = reuseClassName ? className : mkHtmlFullClass(context, className, htmlClass);
    parentRule = addCssRule(context, className, blockStyleDeclarations, node, {
      skipAssignRule: skipAssignRule || (attachClassToNode && context.isRootInComponent),
      customSelector,
      reuseClassName,
      parentRule: parentRule || null, // null for no fallback to node rule when undefined. Here, it should remain a top-level rule.
    });
    if (!skipAddClassAttribute) {
      attributes.push(
        fullClassOverrides
          ? fwConnector.createClassAttribute(node, extraConfig, htmlClass)
          : fwConnector.createClassAttrForClassNoOverride(htmlClass, extraConfig),
      );
    }
  }
  if (attachClassToNode && context.isRootInComponent) {
    // It typically means that htmlClass === 'root'
    // root is the :host element in Angular and should not prefix class names when using the BEM convention.
    // That's how it is implemented in 4-gen-node.ts for other types of nodes.
    htmlClass = undefined;
    parentRule = undefined;
  }
  return { htmlClass, parentRule, className };
}

function push<T>(array: T[], elements: T | T[]) {
  if (Array.isArray(elements)) {
    array.push(...elements);
  } else {
    array.push(elements);
  }
}
