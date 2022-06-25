import { Block, BlockPlain, Declaration, DeclarationPlain, List } from 'css-tree';

import { Nil } from '../../../common/general-utils';
import { warnOrThrow } from '../../../utils';
import { Dict } from '../../sb-serialize-preview/sb-serialize.model';
import { ModuleContext, NodeContext, ParentNode } from '../code.model';
import { isValidNode } from '../create-ts-compiler/canvas-utils';
import { csstree } from '../create-ts-compiler/csstree';
import { addStyle } from './css-factories-high';
import {
  mkBlockCss,
  mkClassSelectorCss,
  mkRuleCss,
  mkSelectorCss,
  mkSelectorListCss,
  mkStylesheetCss,
} from './css-factories-low';
import {
  assertStyleSheet,
  isDeclarationListOrThrow,
  isRootRule,
  isRule,
  isStyleSheet,
  stylesToList,
} from './css-type-utils';

export function addRulesToAppCss(context: ModuleContext, appCss: string, parentNode: ParentNode | Nil) {
  const styles: Dict<DeclarationPlain> = {};

  // Let's wait a bit until we're sure we don't want position absolute here
  // positionAbsoluteFigmaToCode(context, parentNode, styles);

  // TODO skip if styles is not filled? Always skip now? We don't apply flex?

  const node = csstree.parse(appCss);
  if (!isStyleSheet(node)) {
    console.warn('Not a stylesheet', node);
    return;
  }
  for (const child of node.children.toArray()) {
    if (isRule(child) && isRootRule(child) && isDeclarationListOrThrow(child.block.children)) {
      const block: BlockPlain = {
        type: 'Block',
        children: stylesToList(styles),
      };
      const block2 = csstree.fromPlainObject(block) as Block;
      child.block.children.appendList(block2.children as List<Declaration>);
    }
  }

  const cssRulesAsList = csstree.fromPlainObject(mkStylesheetCss(context.cssRules));
  assertStyleSheet(cssRulesAsList);
  node.children.appendList(cssRulesAsList.children);

  if (context.projectContext.extraConfig.isFTD) {
    // Add demo patch
    const figmaNode = isValidNode(parentNode) ? parentNode : context.node;
    const styles2: Dict<DeclarationPlain> = {};

    if (isValidNode(figmaNode)) {
      // Theme switcher styles
      addStyle({ moduleContext: context } as NodeContext, figmaNode, styles2, 'position', 'absolute');
      addStyle({ moduleContext: context } as NodeContext, figmaNode, styles2, 'top', '10px');
      addStyle({ moduleContext: context } as NodeContext, figmaNode, styles2, 'right', '20px');
      addStyle({ moduleContext: context } as NodeContext, figmaNode, styles2, 'z-index', '10');
    } else {
      warnOrThrow(
        `Theme switcher may not be styled as expected, since the parent does not match the criteria I had in mind when coding it. To review. Is it because the node is at top level (and parent is page)? It should work. Something to adapt? Selected node is not a "valid" node? I don't remember why we need it here.`,
      );
    }

    const className = 'themeSwitcher';
    const styleDeclarations = stylesToList(styles2);
    const cssRule = mkRuleCss(
      mkSelectorListCss([mkSelectorCss([mkClassSelectorCss(className)])]),
      mkBlockCss(styleDeclarations),
    );
    node.children.push(csstree.fromPlainObject(cssRule));
  }

  return csstree.generate(node);
}
