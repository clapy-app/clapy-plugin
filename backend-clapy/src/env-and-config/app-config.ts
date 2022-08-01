import type Stripe from 'stripe';

export const appConfig = {
  codeGenFreeQuota: 3,
  codeGenQualifiedQuota: 25,
  stripeConfig: {
    apiVersion: '2020-08-27',
    appInfo: {
      name: 'clapy-dev/checkout',
      version: '0.0.1',
    },
  } as Stripe.StripeConfig,
};

export const flags = {
  measurePerf: false,
  simulateColdStart: false,
  loadLibsTypings: false, // Slower ~1 second
  runDiagnostics: false, // Slower ~1.5 second
  formatCode: true, // Slower ~0.5 second
  // Better for max-width: 100%
  // if changed to true, should update reset in resets.css.
  useCssBoxSizingBorderBox: true,
  useFilterDropShadow: true,
  writeClapyFiles: false,
  destructureClassNames: false, // KO - Need to fix name conflicts between props and imported components before enabling
  enableInstanceOverrides: true,
  throwOnWarnings: false /* env.isDev */,
  indexOverrideByNodeId: false, // easier debugging when overrides are wrong
  writeFigmaIdOnNode: false,
  listUnreadSVGs: false,
};

// What takes time:
// 1) formatting with prettier (TS + CSS) - by far
// 2) generating the SVG React component
// 3) (dev only) write on disk
