import type { ExtraConfig } from '../../../sb-serialize-preview/sb-serialize.model.js';
import type { CodeDict } from '../../code.model.js';

export function patchSCSSInFileContents(resources: CodeDict, extraConfig: ExtraConfig) {
  if (extraConfig.useZipProjectTemplate) {
    const angularJson = JSON.parse(resources['angular.json']);
    const proj = angularJson.projects[Object.keys(angularJson.projects)[0]];
    proj.schematics = {
      '@schematics/angular:component': {
        style: 'scss',
      },
    };
    proj.architect.build.options.inlineStyleLanguage = 'scss';
    proj.architect.test.options.inlineStyleLanguage = 'scss';
    resources['angular.json'] = JSON.stringify(angularJson, null, 2);
  }
}
