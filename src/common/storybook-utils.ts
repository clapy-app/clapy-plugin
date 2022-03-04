import { ArgType, isBooleanArgType, isSelectArgType } from './sb-serialize.model';

export function sanitizeSbUrl(storybookBaseUrl: string) {
  return (
    storybookBaseUrl
      // Remove query parameters `?foo=bar` and hash `#foo` from the URL
      .split(/[?#]/, 1)[0]
      // Remove trailing slash
      .replace(/\/$/, '')
  );
}

export function argTypesToValues(argType: ArgType) {
  if (isBooleanArgType(argType)) {
    return [false, true];
  } else if (isSelectArgType(argType)) {
    return argType.options.map(v => v || 'default');
  }
}
