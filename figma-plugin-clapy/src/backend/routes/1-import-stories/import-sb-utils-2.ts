import { isPage } from '../../common/canvas-utils';
import { getLayoutStoryId } from './3-import-sb-detail';

export function getParentCompNode(selectedNode: SceneNode) {
  let storyId: string | undefined = undefined;
  const pageSbUrl: string | undefined = figma.currentPage.getPluginData('sbUrl');
  const sbUrl = selectedNode.getPluginData('sbUrl') || pageSbUrl;
  let node: SceneNode | null = selectedNode;
  if (sbUrl) {
    while (node && !isPage(node) && !(storyId = getLayoutStoryId(node))) {
      node = node.parent as SceneNode | null;
    }
  }
  return { node, sbUrl, storyId };
}
