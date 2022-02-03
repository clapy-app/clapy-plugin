import { Dict } from '../../../common/app-models';
import { CNode } from './sb-serialize.model';

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
export type SbSelection = keyof StoriesSamples;
export type StoriesSample = StoriesSamples[SbSelection];

// type StoriesObj = typeof storiesSamples[SbSelection]['stories']['stories'];
export interface SbStory {
  // argTypes,
  // args,
  // componentId,
  // id: string;
  kind: string;
  name: string;
  parameters: {
    // docs,
    // docsOnly,
    // fileName,
    // framework,
    // options,
    // themes,
    // viewMode,
    // __id,
    __isArgsStory: boolean;
  },
  story: string;
  title: string;
}
export type SbStories = Dict<SbStory>;

export interface SbStoriesWrapper {
  // globalParameters: {};
  // globals: {};
  // kindParameters: {};
  stories: SbStories;
  v: number;
}

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
