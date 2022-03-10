import { ArgTypeObj } from './app-models';
import { Args, ArgType } from './sb-serialize.model';

export function sanitizeSbUrl(storybookBaseUrl: string) {
  return (
    storybookBaseUrl
      // Remove query parameters `?foo=bar` and hash `#foo` from the URL
      .split(/[?#]/, 1)[0]
      // Remove trailing slash
      .replace(/\/$/, '')
  );
}

export function argTypesToValuesFiltered(
  argName: string,
  argType: ArgType,
  storyArgFilters?: ArgTypeObj,
  initialArgs?: Args,
) {
  const values = argTypesToValues(argType);
  if (!values) return undefined;

  if (storyArgFilters && initialArgs && !storyArgFilters[argName]) {
    // Filtering props is enabled and this arg should not be displayed. We only keep the default value in this case.
    const defaultValue = getArgDefaultValue(argName, initialArgs, values);
    // The default value is not always provided in initialArgs (storybook fact). Consider getting them from argType.table.defaultValue.summary (to JSON-parse) when not available in initialArgs.
    return [defaultValue];
  }
  return values;
}

export function argTypesToValues(argType: ArgType) {
  if (isBooleanArgType(argType)) {
    return [false, true];
  }
  const options = getSelectArgTypeOptions(argType);
  if (options) {
    return options.map(v => v || 'default');
  }
}

function isBooleanArgType(argType: ArgType) {
  return argType.control ? argType.control.type === 'boolean' : argType.type.name === 'boolean';
}

function getSelectArgTypeOptions(argType: ArgType) {
  if (argType.control) {
    return Array.isArray(argType.options) ? argType.options : undefined;
  } else {
    return Array.isArray(argType.type.value) ? argType.type.value : undefined;
  }
}

export function getArgDefaultValue(argName: string, initialArgs: Args, values: any[]) {
  return initialArgs[argName] || values[0];
}
