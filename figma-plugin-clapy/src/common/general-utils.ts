import type { Nil, ObjKey } from './app-models';

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

export function isArrayOf<T>(node: any): node is T[] {
  return Array.isArray(node);
}

/**
 * Ensure the provided function is only called once at a time. A concurrent call gets the promise of the previous
 * call that is not resolved/rejected yet. Once resolved/rejected, subsequent calls will call the provided function
 * and generate a new promise.
 */
export function toConcurrencySafeAsyncFn<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  let _getTokenPromise: Promise<any> | undefined = undefined;
  return (async (...args: any[]) => {
    if (_getTokenPromise) {
      return _getTokenPromise;
    }
    try {
      _getTokenPromise = fn(...args);
      const token = await _getTokenPromise;
      return token;
    } finally {
      _getTokenPromise = undefined;
    }
  }) as T;
}

export function parseTransformationMatrix(transformationMatrix: Transform) {
  const [[a, c, tx], [b, d, ty]] = transformationMatrix;
  const sx = round(Math.sign(a) * Math.sqrt(a * a + b * b));
  const sy = round(Math.sign(d) * Math.sqrt(c * c + d * d));
  const rotation = round(radiansToDegrees(Math.atan2(-b, a)));
  // const rotation2 = round(radiansToDegrees(Math.atan2(c, d)));
  // => Same for traditional transformation matrix.
  // Gives a different result for gradientTransform => not the same type of transformation matrix?
  return {
    tx,
    ty,
    sx,
    sy,
    rotation, // in degrees
  };
}

function radiansToDegrees(radians: number) {
  return radians * (180 / Math.PI);
}
