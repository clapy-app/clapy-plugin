import type { CElementNode, CPseudoElementNode, SbStory } from '../../../../common/sb-serialize.model';
import { env } from '../../../../environment/env';
import type { MyCompNode } from '../../../common/node-type-utils';

export const storiesSamples = {
  reactstrap: {
    label: 'Reactstrap',
    sbUrl: 'https://reactstrap.github.io',
  },
  vibe: {
    label: 'Monday Vibe',
    sbUrl: 'https://style.monday.com',
  },
  ...(env.isDev && {
    equisafe: {
      label: 'Equisafe',
      sbUrl: 'http://localhost:9009',
    },
    rupali: {
      label: 'Rupali',
      sbUrl: 'https://6240065dafe4da003aaa33c2-foshjfdhfb.chromatic.com/',
    },
  }),
} as const;

export type StoriesSamples = Required<typeof storiesSamples>;
export type SbSampleSelection = keyof StoriesSamples;
export type StoriesSample = StoriesSamples[SbSampleSelection];

// type StoriesObj = typeof storiesSamples[SbSelection]['stories']['stories'];

export interface BorderWidths {
  borderBottomWidth: number;
  borderLeftWidth: number;
  borderTopWidth: number;
  borderRightWidth: number;
}

export interface AbsoluteElementToAdd {
  node: FrameNode | GroupNode;
  sbNode: CElementNode | CPseudoElementNode;
  figmaParentNode: MyCompNode;
  absoluteAncestor: MyCompNode;
  absoluteAncestorBorders: BorderWidths;
}

export interface RenderContext {
  storyId: string;
  figmaParentNode: MyCompNode;
  sbParentNode: CElementNode | null;
  previousInlineNode?: TextNode;
  absoluteAncestor: MyCompNode;
  absoluteAncestorBorders: BorderWidths;
  appendInline?: boolean;
  parentIsEmptyWrapper: boolean;
  /**
   * fillContainer = found a non-empty child that fills container
   * hugContents = found at least one non-empty child, all of them hug contents
   * undefined = no non-empty child found (= all children are empty wrappers)
   */
  parentNonEmptyChildMode: 'fillContainer' | 'hugContents' | undefined;
  absoluteElementsToAdd: AbsoluteElementToAdd[];
}

export interface SbStoryWithFolder extends SbStory {
  folders?: string[];
}
