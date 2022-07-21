import type { Properties } from '../constants/Properties.js';
import type { TokenTypes } from '../constants/TokenTypes.js';
import type { NodeTokenRefValue } from './NodeTokenRefValue.js';

export type NodeTokenRefMap = Partial<Record<TokenTypes, NodeTokenRefValue> & Record<Properties, NodeTokenRefValue>>;
