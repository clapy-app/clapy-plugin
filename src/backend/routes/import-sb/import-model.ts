import { Dict } from '../../../common/app-models';
import reactstrapStories from './sample-stories/reactstrap/stories.json';
import vibeStories from './sample-stories/vibe/stories.json';
export const storiesSamples = {
  reactstrap: {
    label: 'Reactstrap',
    stories: reactstrapStories,
    baseUrl: 'https://reactstrap.github.io',
  },
  vibe: {
    label: 'Monday Vibe',
    stories: vibeStories,
    baseUrl: 'https://style.monday.com',
  },
};
export type SbSelection = keyof typeof storiesSamples;

// type StoriesObj = typeof storiesSamples[SbSelection]['stories']['stories'];
export interface StoryObj {
  id: string;
  name: string;
  title?: string;
  importPath?: string;
  kind: string;
  story: string;
  parameters: {
    fileName?: string;
    framework?: 'react';
    docsOnly?: boolean,
    __id: string;
    __isArgsStory: boolean;
  };
}
export type StoriesObj = Dict<StoryObj>;