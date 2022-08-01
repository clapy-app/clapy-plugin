import { env } from '../environment/env';

export const appConfig = {
  codeGenFreeQuota: 3,
  codeGenQualifiedQuota: 25,
  variantsGridGap: 20, // in px
};

export const flags = {
  verbose: false,
  measurePerf: false,
  alphaFeature: env.isDev,
  logWebsocketRequests: true,
  fixSvgStrokePositionBug: true,
  extractInstanceSVG: true,
};

export const extractionStepsLabels = {
  init: 'starting the engine',
  readFigmaNodesConfig: 'reading Figma configuration',
  optimizeConfig: 'optimizing configuration',
  extractTokens: 'extracting Figma Tokens',
  extractSVGs: 'extracting SVGs',
  extractImages: 'extracting images',
  uploadAsset: 'uploading assets',
  generateCode: 'generating code',
};

export const extractionStepsTotal = Object.keys(extractionStepsLabels).length;
