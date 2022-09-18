import type { Block, BlockPlain, Declaration, DeclarationPlain, List } from 'css-tree';

import type { Nil } from '../../../common/general-utils.js';
import { warnOrThrow } from '../../../utils.js';
import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { ModuleContext, NodeContext, ParentNode, ProjectContext } from '../code.model.js';
import { isValidNode } from '../create-ts-compiler/canvas-utils.js';
import { csstree } from '../create-ts-compiler/csstree.js';
import { figmaColorToCssHex } from '../gen-node-utils/utils-and-reset.js';
import { addStyle } from './css-factories-high.js';
import {
  mkBlockCss,
  mkClassSelectorCss,
  mkRuleCss,
  mkSelectorCss,
  mkSelectorListCss,
  mkStylesheetCss,
} from './css-factories-low.js';
import {
  assertStyleSheet,
  isDeclarationListOrThrow,
  isRootRule,
  isRule,
  isStyleSheet,
  stylesToList,
} from './css-type-utils.js';

export function replaceGlobalStyles(projectContext: ProjectContext, appCss: string) {
  const {
    page,
    extraConfig: { page: pageModeEnabled },
  } = projectContext;

  // background color
  const bg = page?.backgrounds?.[0]?.type === 'SOLID' ? page?.backgrounds?.[0] : undefined;
  appCss = appCss?.replaceAll('__backgroundColor__', bg ? figmaColorToCssHex(bg.color, bg.opacity) : '#e5e5e5');

  // centering if not in page mode
  appCss = appCss?.replaceAll(
    '/* __center__ */',
    pageModeEnabled ? '' : `align-items: center;\n  justify-content: center;`,
  );

  return appCss;
}

export function addRulesToAppCss(context: ModuleContext, appCss: string, parentNode: ParentNode | Nil) {
  const { projectContext } = context;
  const { extraConfig } = projectContext;
  const styles: Dict<DeclarationPlain> = {};

  // Let's wait a bit until we're sure we don't want position absolute here
  // positionAbsoluteFigmaToCode(context, parentNode, styles);

  // TODO skip if styles is not filled? Always skip now? We don't apply flex?

  appCss = replaceGlobalStyles(projectContext, appCss);

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

  if (extraConfig.isFTD) {
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
