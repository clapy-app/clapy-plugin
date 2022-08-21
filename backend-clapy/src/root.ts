import { URL } from 'url';

// https://stackoverflow.com/a/66651120/4053349
let __dirname = new URL('.', import.meta.url).pathname;
if (__dirname.endsWith('/')) {
  __dirname = __dirname.slice(0, -1);
}

export const srcDir = __dirname;
export const backendDir = `${__dirname}/..`;
export const rootDir = `${backendDir}/..`;
export const localGenClapyDir = `${rootDir}/../local-gen-clapy`;
export const pluginDir = `${rootDir}/figma-plugin-clapy`;
export const dockerPluginCompDir = `/plugin/components`;

export const exportTemplatesDir = `${backendDir}/export-templates`;
