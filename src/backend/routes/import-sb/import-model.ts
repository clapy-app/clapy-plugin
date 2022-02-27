import { env } from '../../../environment/env';
import { MyCompNode } from './canvas-utils';
import { CElementNode, SbStory } from './sb-serialize.model';

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

export interface RenderContext {
  storyId: string;
  figmaParentNode: MyCompNode;
  sbParentNode: CElementNode | null;
  previousInlineNode?: TextNode;
  absoluteAncestor: MyCompNode;
  absoluteAncestorBorders: BorderWidths;
  appendInline?: boolean;
}

export interface SbStoryWithFolder extends SbStory {
  folders?: string[];
}
