import { CNode, SbStory } from './sb-serialize.model';

export const storiesSamples = {
  reactstrap: {
    label: 'Reactstrap',
    sbUrl: 'https://reactstrap.github.io',
  },
  vibe: {
    label: 'Monday Vibe',
    sbUrl: 'https://style.monday.com',
  },
} as const;

export type StoriesSamples = typeof storiesSamples;
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
  sbParentNode: CNode | null;
  previousInlineNode?: TextNode;
  absoluteAncestor: FrameNode;
  absoluteAncestorBorders: BorderWidths;
}

export interface SbStoryWithFolder extends SbStory {
  folders?: string[];
}
