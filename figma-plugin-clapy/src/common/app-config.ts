import { env } from '../environment/env';

export const appConfig = {
  variantsGridGap: 20, // in px
};

export const flags = {
  alphaFeature: env.isDev,
  logWebsocketRequests: true,
};
