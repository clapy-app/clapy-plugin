import { createHash } from 'sha256-uint8array';

import type { Dict } from '../../common/sb-serialize.model';

export function mkUrl(baseAndPath: string, queryObject?: Dict<string>) {
  if (!queryObject) return baseAndPath;
  const url = new URL(baseAndPath);
  for (const [key, value] of Object.entries(queryObject)) {
    url.searchParams.append(key, value);
  }
  return url.toString();
}

export function createVerifier() {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.';
  let random = '';
  const randomValues = Array.from(crypto.getRandomValues(new Uint8Array(43)));
  for (const v of randomValues) {
    random += charset[v % charset.length];
  }
  return random;
}

export function createChallenge(verifier: string) {
  const b64Chars: { [index: string]: string } = { '+': '-', '/': '_', '=': '' };
  return (
    // sha256 as base64
    hexToBase64(createHash().update(verifier).digest('hex'))
      // Sanitize characters unsafe for URL
      .replace(/[+/=]/g, (m: string) => b64Chars[m])
  );
}

function hexToBase64(hexstring: string) {
  const m = hexstring.match(/\w{2}/g);
  if (!m) return '';
  return window.btoa(
    m
      .map(function (a) {
        return String.fromCharCode(parseInt(a, 16));
      })
      .join(''),
  );
}
