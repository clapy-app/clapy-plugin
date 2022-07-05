import { URL } from 'url';

// https://stackoverflow.com/a/66651120/4053349
const __dirname = new URL('.', import.meta.url).pathname;

export const srcDir = __dirname;
export const backendDir = `${__dirname}/..`;
export const rootDir = `${backendDir}/..`;
export const pluginDir = `${rootDir}/figma-plugin-clapy`;
export const dockerPluginCompDir = `/plugin/components`;

export const exportTemplatesDir = `${backendDir}/export-templates`;
