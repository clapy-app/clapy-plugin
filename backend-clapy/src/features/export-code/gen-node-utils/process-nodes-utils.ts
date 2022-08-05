import type { DeclarationPlain } from 'css-tree';

import { flags } from '../../../env-and-config/app-config.js';
import type { Dict } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { NodeContext } from '../code.model.js';
import type {
  BlockNode,
  ComponentNode2,
  FrameNode2,
  InstanceNode2,
  ValidNode,
  VectorNodeDerived,
} from '../create-ts-compiler/canvas-utils.js';
import { isComponent, isInstance } from '../create-ts-compiler/canvas-utils.js';
import { addStyle } from '../css-gen/css-factories-high.js';
import { stylesToList } from '../css-gen/css-type-utils.js';
import type { FwAttr } from '../frameworks/framework-connectors.js';
import { createNodeWithDefaults } from './default-node.js';
import { genIconComponentImportName, getOrGenClassName } from './gen-unique-name-utils.js';
import { addCssRule, mkHtmlFullClass, mkIdAttribute, mkNamedImportsDeclaration } from './ts-ast-utils.js';

export function registerSvgForWrite(context: NodeContext, svgContent: string) {
  const { moduleContext } = context;
  const { projectContext } = moduleContext;

  const svgPathVarName = genIconComponentImportName(context);

  // Save SVG to convert to React component later, so that we isolate the execution time, which is significant (second most expensive after Prettier formatting).
  projectContext.svgToWrite[`${moduleContext.compDir}/${svgPathVarName}.tsx`] = {
    svgPathVarName,
    svgContent,
  };

  const ext = projectContext.extraConfig.useZipProjectTemplate ? '.js' : '';
  // Add import in file
  // (Note: could be moved to when AST is generated to have the final imports)
  moduleContext.imports[svgPathVarName] = mkNamedImportsDeclaration([svgPathVarName], `./${svgPathVarName}${ext}`);

  return svgPathVarName;
}

export function createSvgAst(
  context: NodeContext,
  node: VectorNodeDerived,
  styles: Dict<DeclarationPlain>,
  svgPathVarName: string,
  wrapWithSwap?: boolean,
) {
  const attributes = addNodeStyles(context, node, styles);
  if (flags.writeFigmaIdOnNode) attributes.push(mkIdAttribute(node.id));
  const {
    moduleContext: { projectContext },
  } = context;
  const { fwConnector } = projectContext;
  const svgAttributes = createSvgClassAttribute(context, node);
  let ast = fwConnector.createSvgTag(svgPathVarName, svgAttributes);
  if (wrapWithSwap) {
    ast = fwConnector.mkSwapInstanceAlone(context, ast, node)!;
  }
  const ast2 = ast && attributes.length ? fwConnector.wrapNode(ast, 'div', attributes) : ast;
  return fwConnector.wrapHideAndTextOverride(context, ast2, node);
}

export function createSvgClassAttribute(context: NodeContext, node: ValidNode) {
  const { fwConnector } = context.moduleContext.projectContext;
  const svgStyles: Dict<DeclarationPlain> = {};
  addStyle(context, node, svgStyles, 'width', '100%');
  addStyle(context, node, svgStyles, 'height', '100%');
  fwConnector.addExtraSvgAttributes(context, node, svgStyles);
  return addNodeStyles2(context, node, svgStyles, 'icon');
}

// If classBaseName is provided, it is used instead of node to generate the attribute.
// Useful for the SVG class attribute, not found to a Figma node.
export function addNodeStyles(context: NodeContext, node: ValidNode, styles: Dict<DeclarationPlain>) {
  const { moduleContext } = context;
  const {
    projectContext: { fwConnector },
  } = moduleContext;
  const styleDeclarations = stylesToList(styles);
  let attributes: FwAttr[] = [];
  if (styleDeclarations.length) {
    const className = getOrGenClassName(moduleContext, node);
    addCssRule(context, className, styleDeclarations, node);
    const htmlClass = mkHtmlFullClass(context, className, node.htmlClass);
    node.htmlClass = htmlClass;
    attributes.push(fwConnector.createClassAttribute(node, htmlClass));
  }
  return attributes;
}

export function addNodeStyles2(
  context: NodeContext,
  node: ValidNode,
  styles: Dict<DeclarationPlain>,
  classBaseName: string,
) {
  const { moduleContext } = context;
  const {
    projectContext: { fwConnector },
  } = moduleContext;
  const styleDeclarations = stylesToList(styles);
  let attributes: FwAttr[] = [];
  if (styleDeclarations.length) {
    const className = getOrGenClassName(moduleContext, undefined, classBaseName);
    addCssRule(context, className, styleDeclarations, node);
    const htmlClass = mkHtmlFullClass(context, className, node.htmlClass);
    attributes.push(fwConnector.createClassAttributeSimple(htmlClass));
  }
  return attributes;
}

// const svgWidthHeightRegex = /^<svg width="\d+" height="\d+"/;
const svgBeginningRegex = /^<svg/;

export function readSvg(context: NodeContext, node: VectorNodeDerived | ComponentNode2 | InstanceNode2) {
  const { projectContext } = context.moduleContext;
  // Remove width and height from SVG. Let the CSS define it.
  // Useless when using SVGR to create a React component, but useful for masking since we don't use React SVG for masking.
  let svgObj = projectContext.svgs[node.id]; /* ?.replace(svgWidthHeightRegex, '<svg') */
  if (svgObj) {
    let { svg } = svgObj;
    if (!svg) {
      console.warn('Missing svg for node ID', node.id);
      return;
    }
    if (flags.listUnreadSVGs && !projectContext.svgsRead.has(node.id)) {
      projectContext.svgsRead.set(node.id, node.name);
    }

    // Add attribute to remove aspect ratio, so that it matches the Figma behavior.
    svg = svg.replace(svgBeginningRegex, '<svg preserveAspectRatio="none"');

    // Patch viewbox if width or height is smaller than the stroke:
    // extend viewbox size to make the stroke visible, to match Figma behavior.
    // The other part of the patch is in applyWidth (flex.ts).
    svg = patchSvgViewBox(svg, node);

    return svg;
  }
}

export function patchInstanceAsSVG(context: NodeContext, node: BlockNode) {
  const isComp = isComponent(node);
  const isInst = isInstance(node);
  if (isComp || isInst) {
    const node2 = node as ComponentNode2 | InstanceNode2;
    // Special case: an instance directly contains the SVG split in multiple shapes. The exported SVG was attached to the instance node, but we want to preserve the instance and have the SVG as a child of the instance.
    let svgContent = readSvg(context, node2);
    if (svgContent) {
      const { id, name } = node2;
      const child = createNodeWithDefaults({ id, name, type: 'VECTOR' }) as FrameNode2;
      child.width = node2.width;
      child.height = node2.height;
      child.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
      node2.children = [child];
    }
  }
}

const viewBoxRegex2 = /(<svg [^>]*?viewBox=["'])(-?[\d\.]+)[, ]+(-?[\d\.]+)[, ]([\d\.]+)[, ]([\d\.]+)(["'])/;

function patchSvgViewBox(svg: string, node: VectorNodeDerived | ComponentNode2 | InstanceNode2) {
  if (!svg) return svg;
  return svg.replace(
    viewBoxRegex2,
    (match: string, begin: string, xStr: string, yStr: string, widthStr: string, heightStr: string, end: string) => {
      const [x, y, width, height] = [parseFloat(xStr), parseFloat(yStr), parseFloat(widthStr), parseFloat(heightStr)];
      if (width != null && height != null) {
        let width2 = width,
          height2 = height;
        if (width2 < node.strokeWeight) {
          width2 = node.strokeWeight;
        }
        if (height2 < node.strokeWeight) {
          height2 = node.strokeWeight;
        }
        if (width2 !== width || height2 !== height) {
          return `${begin}${x} ${y} ${width2} ${height2}${end}`;
        }
      }
      // No override, preserve the original viewbox.
      return match;
    },
  );
}

const htmlEntitiesMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;',
  '{': '&#123;',
  '}': '&#125;',
};
type EntitiesToEscape = keyof typeof htmlEntitiesMap;
type htmlEntitiesKeys = EntitiesToEscape;
const entities = Object.keys(htmlEntitiesMap) as Array<EntitiesToEscape>;
const entitiesRegex = new RegExp(`[${entities.join('')}]`, 'g');

// A more complete version, if required: https://www.npmjs.com/package/html-entities
export function escapeHTML(str: string) {
  // Escape forbidden characters in HTML
  str = str.replace(entitiesRegex, (tag: string) => {
    const res = htmlEntitiesMap[tag as htmlEntitiesKeys];
    return res;
  });
  // Replaces all line breaks with HTML tag <br /> to preserve line breaks
  str = str.replace(/\r\n|\r|\n|[\x0B\x0C\u0085\u2028\u2029]/g, '<br />');
  return str;
}

export function useBem(context: NodeContext) {
  const { scss, bem } = context.moduleContext.projectContext.extraConfig;
  return scss && bem;
}
