import type { NodeContext } from '../code.model.js';
import type { BlockNode } from '../create-ts-compiler/canvas-utils.js';
import { mkBlockCss, mkRawCss, mkRuleCss, mkSelectorCss, mkSelectorListCss } from '../css-gen/css-factories-low.js';
import { stylesToList } from '../css-gen/css-type-utils.js';

export function genBeforeStyles(context: NodeContext, node: BlockNode, className: string | undefined) {
  if (!className) return;

  // the CSS rule is created before checking the children so that it appears first in the CSS file.
  // After generating the children, we can add the final list of rules or remove it if no rule.
  // const cssRule = addCssRule(context, false, [], node);

  const styleDeclarations = node.beforeStyles ? stylesToList(node.beforeStyles) : undefined;
  const hasStyles = !!styleDeclarations?.length;
  if (hasStyles) {
    const selector = mkRawCss(`.${className}::before`);
    const selectors = mkSelectorListCss([mkSelectorCss([selector])]);
    const block = mkBlockCss(styleDeclarations);
    let cssRule = mkRuleCss(selectors, block);
    const { cssRules } = context.moduleContext;
    cssRules.push(cssRule);
  }
}
