import { sha256 } from 'sha.js';

export function mkUrl(baseAndPath: string, queryObject?: any) {
  if (!queryObject) return baseAndPath;
  const queryParams = new URLSearchParams(queryObject).toString();
  return `${baseAndPath}?${queryParams}`;
}

export function createVerifier() {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.';
  let random = '';
  const randomValues = Array.from(crypto.getRandomValues(new Uint8Array(43)));
  for (const v of randomValues) {
    random += charset[v % charset.length];
  }
  return random;
};

export function createChallenge(verifier: string) {
  const b64Chars: { [index: string]: string; } = { '+': '-', '/': '_', '=': '' };
  return new sha256().update(verifier).digest('base64')
    // Sanitize characters unsafe for URL
    .replace(/[+/=]/g, (m: string) => b64Chars[m]);
}
