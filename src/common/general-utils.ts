import { ObjKey } from './app-models';

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

export function objectIsNotEmpty(obj: any) {
  return !!obj && typeof obj === 'object' && Object.getOwnPropertyNames(obj).length > 0;
}

export function keyBy<T>(array: T[], field: keyof T) {
  const indexed = {} as { [key: ObjKey]: T };
  for (const obj of array) {
    const key = obj[field] as unknown as ObjKey;
    indexed[key] = obj;
  }
  return indexed;
}
