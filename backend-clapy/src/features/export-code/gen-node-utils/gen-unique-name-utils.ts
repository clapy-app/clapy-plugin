import type { ModuleContext, NodeContext, ProjectContext } from '../code.model.js';
import type { SceneNode2 } from '../create-ts-compiler/canvas-utils.js';
import { isComponentSet } from '../create-ts-compiler/canvas-utils.js';

export enum TextCase {
  Pascal,
  Camel,
  Dash,
}

export function getOrGenClassName(moduleContext: ModuleContext, node?: SceneNode2, defaultClassName = 'label'): string {
  if (node?.className) {
    return node.className;
  }
  // It may be equivalent to `isComponent(node)`, but for safety, I keep the legacy test. We can refactor later, and test when the app is stable.
  const isRootInComponent = node === moduleContext.node;
  // No node when working on text segments. But can we find better class names than 'label' for this case?
  const baseName = node?.name || defaultClassName;
  const className = isRootInComponent ? 'root' : genUniqueName(moduleContext.classNamesAlreadyUsed, baseName);
  if (node) {
    node.className = className;
  }
  return className;
}

export function getOrGenSwapName(componentContext: ModuleContext, node?: SceneNode2, swapBaseName?: string) {
  if (node?.swapName) {
    return node.swapName;
  }
  if (!node?.name && !swapBaseName) {
    throw new Error(
      `Either a node with a name or a swapBaseName is required to generate a swapName on module ${componentContext.compName}`,
    );
  }
  const baseName = node?.name || swapBaseName!;
  const swapName = genUniqueName(componentContext.swaps, baseName);
  if (node) {
    node.swapName = swapName;
  }
  return swapName;
}

export function getOrGenHideProp(componentContext: ModuleContext, node?: SceneNode2, hideBaseName?: string) {
  if (node?.hideProp) {
    return node.hideProp;
  }
  if (!node?.name && !hideBaseName) {
    throw new Error(
      `Either a node with a name or a hideBaseName is required to generate a hideProp on module ${componentContext.compName}`,
    );
  }
  const baseName = node?.name || hideBaseName!;
  const hideProp = genUniqueName(componentContext.hideProps, baseName);
  if (node) {
    node.hideProp = hideProp;
  }
  return hideProp;
}

export function getOrGenTextOverrideProp(
  componentContext: ModuleContext,
  node?: SceneNode2,
  textOverrideBaseName?: string,
) {
  if (node?.textOverrideProp) {
    return node.textOverrideProp;
  }
  if (!node?.name && !textOverrideBaseName) {
    throw new Error(
      `Either a node with a name or a textOverrideBaseName is required to generate a textOverrideProp on module ${componentContext.compName}`,
    );
  }
  const baseName = node?.name || textOverrideBaseName!;
  const textOverrideProp = genUniqueName(componentContext.textOverrideProps, baseName);
  if (node) {
    node.textOverrideProp = textOverrideProp;
  }
  return textOverrideProp;
}

export function genComponentImportName(context: NodeContext) {
  // The variable is generated from the node name. But 'icon' is a bad variable name. If that's the node name, let's use the parent instead.
  let baseName =
    context.nodeNameLower === 'icon' && context.parentContext?.nodeNameLower
      ? context.parentContext?.nodeNameLower
      : context.nodeNameLower;
  if (baseName !== 'icon') {
    baseName = `${baseName}Icon`;
  }
  return genUniqueName(context.moduleContext.subComponentNamesAlreadyUsed, baseName, TextCase.Pascal);
}

export function getComponentName(
  projectContext: ProjectContext,
  node: SceneNode2,
  textCase: TextCase = TextCase.Pascal,
) {
  const name = isComponentSet(node.parent) ? `${node.parent.name}_${node.name}` : node.name;
  return genUniqueName(projectContext.compNamesAlreadyUsed, name, textCase);
}

export function genUniqueName(usageCache: Set<string>, baseName: string, textCase: TextCase = TextCase.Camel) {
  const sanitize = textCase === TextCase.Pascal ? pascalize : textCase === TextCase.Camel ? camelize : dashize;
  const sanitizedName = sanitize(baseName) || 'unnamed';
  let name = sanitizedName;
  let i = 1;
  while (usageCache.has(name)) {
    ++i;
    name = `${sanitizedName}${i}`;
  }
  usageCache.add(name);
  return name;
}

// https://stackoverflow.com/a/2970667/4053349
function pascalize(str: string) {
  return prefixIfNumber(
    removeAccents(str)
      .replace(/(?:^\w|[A-Z]|\b\w|\s+|[^\w])/g, match => {
        if (+match === 0 || !/\w/.test(match)) return ''; // or if (/\s+/.test(match)) for white spaces
        return match.toUpperCase();
      })
      // Truncate if variable name is too long
      .substring(0, 30),
  );
}

function camelize(str: string) {
  return prefixIfNumber(
    removeAccents(str)
      .replace(/(?:^\w|[A-Z]|\b\w|\s+|[^\w])/g, (match, index) => {
        if (+match === 0 || !/\w/.test(match)) return ''; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      })
      // Truncate if variable name is too long
      .substring(0, 30),
  );
}

function dashize(str: string) {
  return prefixIfNumber(
    removeAccents(str)
      .replace(/(?:^\w|[A-Z]|\b\w|\s+|[^\w])/g, (match, index) => {
        if (+match === 0 || !/\w/.test(match)) return ''; // or if (/\s+/.test(match)) for white spaces
        match = match.toLowerCase();
        return index === 0 ? match : `-${match}`;
      })
      // Truncate if variable name is too long
      .substring(0, 30),
  );
}

function removeAccents(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function prefixIfNumber(varName: string) {
  return varName.match(/^\d/) ? `_${varName}` : varName;
}
