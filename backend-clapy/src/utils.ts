import { randomBytes } from 'crypto';

export type Dict2<Key extends string | number | symbol, Value> = {
  [key in Key]: Value;
};

type Entry<T> = { [K in keyof T]: [K, T[K]] }[keyof T] & Iterable<any>;
export function entries<T>(o: T): Entry<T>[] {
  return Object.entries(o) as unknown as Entry<T>[];
}

export function handleError(error: any) {
  console.error(error);
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
  return str ? str.replace(/^\s*"\s*(.*?)\s*"\s*$/, '$1').trim() as T : str;
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
    return ((((unicode.charCodeAt(0) - 0xD800) * 0x400) + (unicode.charCodeAt(1) - 0xDC00) + 0x10000));
  }
  throw new Error(`Unsupported unicode character, can't return the hexa code: \`${unicode}\``);
}
function isUnicodeInPrivateUseAreas(charCode: number) {
  // https://en.wikipedia.org/wiki/Private_Use_Areas
  return (charCode >= 0xE000 && charCode <= 0xF8FF) || (charCode >= 0xF0000 && charCode <= 0xFFFFD) || (charCode >= 0x100000 && charCode <= 0x10FFFD);
}

// function pick<T>(o: T, ...props: (keyof T)[]): Partial<T> {
//   return Object.assign({}, ...props.map(prop => ({ [prop]: o[prop] })));
// }
