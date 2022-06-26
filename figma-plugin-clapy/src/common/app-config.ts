import { env } from '../environment/env';

export const appConfig = {
  variantsGridGap: 20, // in px
};

export const flags = {
  verbose: false,
  measurePerf: false,
  alphaFeature: env.isDev,
  logWebsocketRequests: true,
  fixSvgStrokePositionBug: true,
};
