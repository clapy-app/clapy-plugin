import type { SingleToken } from './SingleToken.js';

export interface DeepKeyTokenMap extends Record<string, DeepKeyTokenMap | SingleToken> {}
