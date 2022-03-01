export function sanitizeSbUrl(storybookBaseUrl: string) {
  return (
    storybookBaseUrl
      // Remove query parameters `?foo=bar` and hash `#foo` from the URL
      .split(/[?#]/, 1)[0]
      // Remove trailing slash
      .replace(/\/$/, '')
  );
}
