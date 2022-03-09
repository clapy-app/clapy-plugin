import { ArgTypeUsed } from '../../../common/app-models';
import { Args, ArgTypes } from '../../../common/sb-serialize.model';
import { argTypesToValues } from '../../../common/storybook-utils';
import { isComponentSet, MyCompNode } from '../../common/canvas-utils';

export function setStoryFrameProperties(
  frame: MyCompNode,
  storyName: string,
  sbUrl: string,
  storyId: string,
  storyTitle: string,
  argTypes: ArgTypes,
  initialArgs: Args,
) {
  // frame.name = `${storyTitle}_${story.name || story.story}`;
  frame.name = storyName;
  frame.setPluginData('sbUrl', sbUrl);
  frame.setPluginData('storyId', storyId);
  frame.setPluginData('storyTitle', storyTitle);
  // Store argTypes to generate variants - may not be useful, to challenge later.
  frame.setPluginData('storyArgTypes', JSON.stringify(argTypes));
  frame.setPluginData('storyInitialArgs', JSON.stringify(initialArgs));
  frame.setRelaunchData({ preview: '' });
  frame.expanded = false;
}

// During the selection, if it is a componentSet with variants, we read the list of current props rendered (with axis and order) + the complete list to have those excluded.
// The front will merge and render the list.

export function listVariantProps(node: SceneNode, argTypes: ArgTypes) {
  if (!isComponentSet(node)) {
    return undefined;
  }
  if (!node.children?.length) {
    console.warn('Component set with no child? I thought it was impossible.');
    return [];
  }
  const firstChild = node.children[0];

  // Reading the first variant only should be enough if no bug.
  // If we need to be safe, we could also read all variants to have the complete list of props.
  const argTypesUsedSet = new Set(
    firstChild.name
      .split(',')
      .map(keyVal => keyVal.split('=')[0].trim())
      .filter(prop => prop),
  );

  const argTypes2: ArgTypeUsed[] = Object.entries(argTypes)
    .filter(([_, argType]) => argTypesToValues(argType))
    .map(([argName, _]) => ({
      argName,
      // argType,
      used: argTypesUsedSet.has(argName),
    }));
  return argTypes2;

  // TODO Next: changing the props selection updates the canvas.
  // Store the previous and next state (what is checked and not). Compare and, if different, show a button to apply the changes.
  // Then it will remove the nodes unchecked and add squares on nodes added. Nodes moved should be reused, just changed of location if applicable.

  // TODO uncheck-recheck should hide the "update" button.
}
