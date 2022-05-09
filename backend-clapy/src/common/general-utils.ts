import { ObjKey } from '../features/sb-serialize-preview/sb-serialize.model';

export type Nil = null | undefined;

export function wait(milliseconds?: number, setClearer?: (clearer: () => void) => void) {
  return new Promise<void>(resolve => {
    const id = setTimeout(resolve, milliseconds);
    setClearer?.(() => clearTimeout(id));
  });
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

export async function waitInfinite(setClearer?: (clearer: () => void) => void) {
  return wait(2147483647, setClearer);
}

export function isArrayOf<T>(node: any): node is T[] {
  return Array.isArray(node);
}
