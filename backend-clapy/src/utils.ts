import { randomBytes } from 'crypto';

import { flags } from './env-and-config/app-config.js';
import { env } from './env-and-config/env.js';

type Entry<T> = { [K in keyof T]: [K, T[K]] }[keyof T] & Iterable<any>;
export function entries<T>(o: T): Entry<T>[] {
  return Object.entries(o) as unknown as Entry<T>[];
}

export function handleError(error: any) {
  console.error(error);
}

export function warnOrThrow(message: string) {
  if (env.isDev && flags.throwOnWarnings) {
    throw new Error(message);
  } else {
    console.warn(message);
  }
}

export async function generateToken() {
  return new Promise<string>((resolve, reject) => {
    randomBytes(48, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer.toString('hex'));
      }
    });
  });
}

export function unquoteAndTrimString<T extends string | undefined>(str: T): T {
  return str ? (str.replace(/^\s*"\s*(.*?)\s*"\s*$/, '$1').trim() as T) : str;
}

// Unicode check functions
export function checkIsFontIcon(content: string): boolean {
  if (isUnicode(content)) {
    const charCode = getCharCodeFromUnicodeChar(content);
    return isUnicodeInPrivateUseAreas(charCode);
  }
  return false;
}
function isUnicode(str: string): boolean {
  return str.length === 1 || str.length === 2;
}
function getCharCodeFromUnicodeChar(unicode: string) {
  if (unicode.length === 1) {
    return unicode.charCodeAt(0);
  } else if (unicode.length === 2) {
    // src: https://stackoverflow.com/a/37729608/4053349
    return (unicode.charCodeAt(0) - 0xd800) * 0x400 + (unicode.charCodeAt(1) - 0xdc00) + 0x10000;
  }
  throw new Error(`Unsupported unicode character, can't return the hexa code: \`${unicode}\``);
}
function isUnicodeInPrivateUseAreas(charCode: number) {
  // https://en.wikipedia.org/wiki/Private_Use_Areas
  return (
    (charCode >= 0xe000 && charCode <= 0xf8ff) ||
    (charCode >= 0xf0000 && charCode <= 0xffffd) ||
    (charCode >= 0x100000 && charCode <= 0x10fffd)
  );
}

// function pick<T>(o: T, ...props: (keyof T)[]): Partial<T> {
//   return Object.assign({}, ...props.map(prop => ({ [prop]: o[prop] })));
// }
