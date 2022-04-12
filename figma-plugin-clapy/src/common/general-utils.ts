import { Nil, ObjKey } from './app-models';

export function wait(milliseconds?: number) {
  return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
}

type Entry<T> = { [K in keyof T]: [K, T[K]] }[keyof T] & Iterable<any>;
export function entries<T>(o: T): Entry<T>[] {
  return Object.entries(o) as unknown as Entry<T>[];
}

export function unquoteAndTrimString<T extends string | undefined>(str: T): T {
  return str ? (str.replace(/^\s*"\s*(.*?)\s*"\s*$/, '$1').trim() as T) : str;
}

/**
 * @returns true if the argument is an object with at least one key, false otherwise.
 */
export function isNonEmptyObject<T>(obj: T | Nil): obj is T {
  return !!obj && typeof obj === 'object' && !isEmptyObject(obj);
}

export function isEmptyObject(obj: any) {
  for (var prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      return false;
    }
  }
  return true;
}

export function keyBy<T>(array: T[], field: keyof T) {
  const indexed = {} as { [key: ObjKey]: T };
  for (const obj of array) {
    const key = obj[field] as unknown as ObjKey;
    indexed[key] = obj;
  }
  return indexed;
}

/**
 * @param start start of measurement. Use performance.now() to get the value when you start measuring.
 * @param end end of measurement. Use performance.now() to get the value when you stop measuring.
 * @returns duration in seconds between start and end
 */
export function getDuration(start: number, end: number) {
  return Math.round(end - start) / 1000;
}

export function round(num: number, precision = 4) {
  let res = Math.round(num * 10 ** precision) / 10 ** precision;
  // To avoid -0 (not nice for display)
  return res === 0 ? 0 : res;
}
