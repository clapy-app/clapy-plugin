import { DeclarationPlain } from 'css-tree';
import ts from 'typescript';

import { env } from '../../env-and-config/env';
import { handleError } from '../../utils';
import { Dict } from '../sb-serialize-preview/sb-serialize.model';
import { mapCommonStyles, mapTagStyles, mapTextStyles, postMapStyles } from './6-figma-to-code-map';
import { InstanceContext, JsxOneOrMore } from './code.model';
import {
  ChildrenMixin2,
  FlexNode,
  GroupNode2,
  isBlockNode,
  isChildrenMixin,
  isFlexNode,
  isGroup,
  isText,
  isValidNode,
  isVector,
  SceneNode2,
  ValidNode,
} from './create-ts-compiler/canvas-utils';
import { stylesToList } from './css-gen/css-type-utils';
import { addCssRule, genClassName, mkClassAttr, mkTag, removeCssRule } from './figma-code-map/details/ts-ast-utils';
import { warnNode } from './figma-code-map/details/utils-and-reset';

export function genInstanceOverrides(context: InstanceContext, node: SceneNode2, isRoot = false) {
  try {
    if (!node.visible) {
      return;
    }
    const { parentNode } = context;

    const styles: Dict<DeclarationPlain> = {};

    // TODO what if a node is another instance?

    if (!isValidNode(node) && !isGroup(node)) {
      warnNode(node, 'TODO Unsupported instance node');
      return;
    }

    const parentIsAutoLayout = isFlexNode(parentNode) && parentNode.layoutMode !== 'NONE';

    // Cf notes in 4-gen-node.ts
    if (isGroup(node) && (!parentIsAutoLayout || isGroup(parentNode))) {
      recurseOnChildren(context, node, styles, true);
      return;
    }

    // Add common styles (text and tags)
    mapCommonStyles(context, node, styles);

    if (isText(node)) {
      // Add text styles
      let ast: JsxOneOrMore | undefined = mapTextStyles(context, node, styles);
      if (!ast) {
        warnNode(node, 'No text segments found in node. Cannot generate the HTML tag.');
        return;
      }

      const flexStyles: Dict<DeclarationPlain> = {};
      mapTagStyles(context, node, flexStyles);

      postMapStyles(context, node, styles);
      postMapStyles(context, node, flexStyles);

      if (!context.parentStyles || Object.keys(flexStyles).length) {
        const className = genClassName(context, node, isRoot);
        const styleDeclarations = [...stylesToList(styles), ...stylesToList(flexStyles)];
        let attributes: ts.JsxAttribute[] = [];
        if (styleDeclarations.length) {
          addCssRule(context, className, styleDeclarations);
          attributes.push(mkClassAttr(className));
        }
        ast = mkTag('div', attributes, Array.isArray(ast) ? ast : [ast]);
      } else {
        Object.assign(context.parentStyles, styles);
      }
      //
      // return ast;
      // TODO something with the ast, likely add as attribute of the instance (render prop)
      //
    } else if (isVector(node)) {
      return addNodeStyles(context, node, styles, isRoot);
    } else if (isBlockNode(node)) {
      // Add tag styles
      mapTagStyles(context, node, styles);

      const className = genClassName(context, node, isRoot);

      // the CSS rule is created before checking the children so that it appears first in the CSS file.
      // After generating the children, we can add the final list of rules or remove it if no rule.
      const cssRule = addCssRule(context, className);

      if (isChildrenMixin(node)) {
        recurseOnChildren(context, node, styles);
      }

      postMapStyles(context, node, styles);
      const styleDeclarations = stylesToList(styles);
      if (styleDeclarations.length) {
        cssRule.block.children.push(...styleDeclarations);
      } else {
        removeCssRule(context, cssRule, node);
      }

      addClassOverride(context, className);
    }
  } catch (error) {
    warnNode(node, 'Failed to generate instance override for component node with error below. Skipping the node.');
    if (!env.isProd) {
      throw error;
    }
    // Production: don't block the process
    handleError(error);
    return;
  }
}

function recurseOnChildren(
  context: InstanceContext,
  node: SceneNode2 & ChildrenMixin2,
  styles: Dict<DeclarationPlain>,
  passParentToChildContext?: boolean,
) {
  // Rare case: masks change on the instance, e.g. because a frame clipsContent changes
  // (if no clipsContent, it doesn't ends the list of masked nodes).
  // For that case, we would need to recalculate maskedBy.
  // Later...

  const {
    parentNode,
    parentStyles,
    parentContext,
    moduleContext,
    nodeOfComp,
    componentContext,
    instanceClasses,
    instanceAttributes,
  } = context;
  if (!isChildrenMixin(nodeOfComp)) {
    warnNode(node, 'BUG Instance node has children, but the corresponding component node does not.');
    throw new Error('BUG Instance node has children, but the corresponding component node does not.');
  }

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.skip) {
      continue;
    }
    const contextForChildren: InstanceContext = {
      moduleContext,
      tagName: 'div', // Default value, will be overridden. To avoid undefined in typing.
      nodeNameLower: child.name.toLowerCase(),
      parentNode: passParentToChildContext ? parentNode : (node as FlexNode | GroupNode2),
      parentStyles: passParentToChildContext ? parentStyles : styles,
      parentContext: passParentToChildContext ? parentContext : context,
      componentContext,
      instanceClasses,
      instanceAttributes,
      nodeOfComp: nodeOfComp.children[i],
    };
    genInstanceOverrides(contextForChildren, child);
  }
}

function addNodeStyles(context: InstanceContext, node: ValidNode, styles: Dict<DeclarationPlain>, isRoot: boolean) {
  mapTagStyles(context, node, styles);
  const className = genClassName(context, node, isRoot);
  postMapStyles(context, node, styles);
  const styleDeclarations = stylesToList(styles);
  if (styleDeclarations.length) {
    addCssRule(context, className, styleDeclarations);
    addClassOverride(context, className);
  }
}

function addClassOverride(context: InstanceContext, className: string) {
  const { instanceClasses, nodeOfComp } = context;
  if (!nodeOfComp.className) {
    throw new Error(`Component node ${nodeOfComp.name} has no className`);
  }
  if (!className) {
    throw new Error(
      `Component node ${nodeOfComp.name}: trying to set a nil className for overrides for classes ${nodeOfComp.className}`,
    );
  }
  if (instanceClasses[nodeOfComp.className]) {
    throw new Error(
      `Component node ${nodeOfComp.name}: trying to set classes ${nodeOfComp.className} with value ${className}, but this classes entry is already set`,
    );
  }
  instanceClasses[nodeOfComp.className] = className;
}
