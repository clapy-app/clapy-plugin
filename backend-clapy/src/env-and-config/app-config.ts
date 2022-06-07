import { env } from './env';

export const appConfig = {};

export const flags = {
  measurePerf: false,
  loadLibsTypings: false, // Slower ~1 second
  runDiagnostics: false, // Slower ~1.5 second
  formatCode: true, // Slower ~0.5 second
  // Better for max-width: 100%
  // if changed to true, should update reset in resets.css.
  useCssBoxSizingBorderBox: true,
  useFilterDropShadow: true,
  writeClapyFiles: false,
  destructureClassNames: false, // Need to fix name conflicts between props and imported components before enabling
  enableInstanceOverrides: env.isDev,
  stripInstancesInComponents: false,
  throwOnWarnings: false /* env.isDev */,
};

// What takes time:
// 1) formatting with prettier (TS + CSS) - by far
// 2) generating the SVG React component
// 3) (dev only) write on disk
