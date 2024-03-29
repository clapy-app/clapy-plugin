import { readFile } from 'fs/promises';

import type { Dict, ObjKey } from '../features/sb-serialize-preview/sb-serialize.model.js';

export type Nil = null | undefined;

export function wait(milliseconds?: number, setClearer?: (clearer: () => void) => void) {
  return new Promise<void>(resolve => {
    const id = setTimeout(resolve, milliseconds);
    setClearer?.(() => clearTimeout(id));
  });
}

type Entry<T> = { [K in keyof T]: [K, T[K]] }[keyof T] & Iterable<any>;
export function entries<T extends Dict>(o: T): Entry<T>[] {
  return Object.entries(o) as unknown as Entry<T>[];
}

export function unquoteAndTrimString<T extends string | undefined>(str: T): T {
  return str ? (str.replace(/^\s*"\s*(.*?)\s*"\s*$/, '$1').trim() as T) : str;
}

// Prefer lodash _.isPlainObject
// export function isObject(obj: any): boolean {
//   return Object.getPrototypeOf(obj) === Object.prototype;
// }

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

export async function waitInfinite(setClearer?: (clearer: () => void) => void) {
  return wait(2147483647, setClearer);
}

export function isArrayOf<T>(node: any): node is T[] {
  return Array.isArray(node);
}

export async function importJsonFile<T = any>(path: string): Promise<T> {
  return JSON.parse(await readFile(new URL('./some-file.json', import.meta.url), { encoding: 'utf8' }));
}

export function renameField(object: Dict<any>, oldKey: string, newKey: string) {
  // Change the key of a field. Src: https://stackoverflow.com/a/50101979/4053349
  delete Object.assign(object, { [newKey]: object[oldKey] })[oldKey];
}
export function countOccurences(fullString: string, subStr: string) {
  return fullString.split(subStr).length - 1;
}
