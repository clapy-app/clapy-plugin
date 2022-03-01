import { MyCompNode } from '../../common/canvas-utils';
import { ArgTypes } from '../../common/sb-serialize.model';

export function setStoryFrameProperties(
  frame: MyCompNode,
  storyName: string,
  sbUrl: string,
  storyId: string,
  storyTitle: string,
  argTypes: ArgTypes,
) {
  // frame.name = `${storyTitle}_${story.name || story.story}`;
  frame.name = storyName;
  frame.setPluginData('sbUrl', sbUrl);
  frame.setPluginData('storyId', storyId);
  frame.setPluginData('storyTitle', storyTitle);
  // Store argTypes to generate variants - may not be useful, to challenge later.
  frame.setPluginData('storyArgTypes', JSON.stringify(argTypes));
  frame.setRelaunchData({ preview: '' });
  frame.expanded = false;
}
