import { env } from '../../../environment/env';
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
  }
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
  figmaParentNode: FrameNode;
  sbParentNode: CElementNode | null;
  previousInlineNode?: TextNode;
  absoluteAncestor: FrameNode;
  absoluteAncestorBorders: BorderWidths;
}

export interface SbStoryWithFolder extends SbStory {
  folders?: string[];
}
