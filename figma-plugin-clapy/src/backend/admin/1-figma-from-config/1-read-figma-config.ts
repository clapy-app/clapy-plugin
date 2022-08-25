import type { Dict } from '../../../common/sb-serialize.model.js';
import { createPage } from './2-create-figma-page.js';
import { cleanUpLastLaunch } from './utils.js';

interface Svg {
  svg: string;
  name: string;
}

type Svgs = Dict<Svg>;

export interface FigmaConfigContext {
  svgs: Svgs;
}
export function generateConfig(figmaConfig: any) {
  cleanUpLastLaunch();
  for (const config of figmaConfig) {
    const context: FigmaConfigContext = {
      svgs: config.figmaConfig.svgs,
    };
    createPage(config.figmaConfig, context);
  }
}
