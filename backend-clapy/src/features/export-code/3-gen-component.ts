import { SourceFile, ts } from 'ts-morph';

import { figmaToAstRec } from './4-gen-node';
import { CodeDict, ComponentContext, NodeContext, ParentNode, ProjectContext } from './code.model';
import { createComponent, getCompDirectory } from './create-ts-compiler/3-create-component';
import { isPage, SceneNode2 } from './create-ts-compiler/canvas-utils';
import { getFirstExportedComponentsInFileOrThrow } from './create-ts-compiler/parsing.utils';
import { cssAstToString, mkStylesheetCss } from './css-gen/css-factories-low';
import { genUniqueName, mkFragment } from './figma-code-map/details/ts-ast-utils';

export async function genComponent(
  projectContext: ProjectContext,
  node: SceneNode2,
  parent: ParentNode | null,
  callerFile: SourceFile,
  relativePathToComponentDir: string,
  parentCompContext?: ComponentContext,
) {
  const { project, cssFiles } = projectContext;

  const compName = genUniqueName(projectContext.compNamesAlreadyUsed, node.name, true);
  const file = await createComponent(project, compName);

  const componentContext: ComponentContext = {
    projectContext,
    file,
    compName,
    classNamesAlreadyUsed: new Set(),
    importNamesAlreadyUsed: new Set(),
    cssRules: [],
    inInteractiveElement: parentCompContext?.inInteractiveElement || false,
  };

  await addComponentToProject(componentContext, node, parent, cssFiles);

  // Then update the file consuming the component
  callerFile.addImportDeclaration({
    moduleSpecifier: `${relativePathToComponentDir}/${compName}/${compName}`,
    namedImports: [compName],
  });

  return componentContext;
}

export async function addComponentToProject(
  componentContext: ComponentContext,
  root: SceneNode2,
  parent: ParentNode | null,
  cssFiles: CodeDict,
) {
  const { file, compName } = componentContext;

  // Get the returned expression that we want to replace
  const { returnedExpression, compDeclaration } = getFirstExportedComponentsInFileOrThrow(file);
  compDeclaration.getNameNodeOrThrow().replaceWithText(compName);

  const [tsx, css] = await figmaToAstRootNode(componentContext, root, parent);

  // Replace the returned expression with the newly generated code
  returnedExpression.transform((/* traversal */) => {
    // traversal.currentNode
    // traversal.visitChildren()
    return (Array.isArray(tsx) ? mkFragment(tsx) : tsx) || ts.factory.createNull();
  });

  // Add CSS file.
  cssFiles[`${getCompDirectory(compName)}/${compName}.module.css`] = cssAstToString(css);
}

async function figmaToAstRootNode(componentContext: ComponentContext, root: SceneNode2, parent: ParentNode | null) {
  const nodeContext: NodeContext = {
    componentContext,
    tagName: 'div', // Default value
    nodeNameLower: root.name.toLowerCase(),
    parentNode: parent,
    parentStyles: null,
    parentContext: null,
    isPageLevel: isPage(parent),
  };
  const tsx = await figmaToAstRec(nodeContext, root, true);
  const cssAst = mkStylesheetCss(componentContext.cssRules);
  return [tsx, cssAst] as const;
}
