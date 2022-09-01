import type { TooltipProps } from '@mui/material';

import { env } from '../environment/env';

export const appConfig = {
  variantsGridGap: 20, // in px
  tooltipPosition: 'top-start' as TooltipProps['placement'], // used to be bottom-start
};

export const flags = {
  verbose: false,
  measurePerf: false,
  alphaFeature: env.isDev,
  logWebsocketRequests: false,
  fixSvgStrokePositionBug: true,
  extractInstanceSVG: true,
  groupSvgInCompInstance: false,
};

export const extractionStepsLabels = {
  init: 'starting the engine',
  readFigmaNodesConfig: 'reading Figma configuration',
  optimizeConfig: 'optimizing configuration',
  extractTokens: 'extracting Figma Tokens',
  extractSVGs: 'extracting SVGs',
  extractImages: 'extracting images',
  uploadAsset: 'uploading assets',
  readGhSettings: 'reading github settings',
  generateCode: 'generating code',
};

export const extractionStepsTotal = Object.keys(extractionStepsLabels).length;
