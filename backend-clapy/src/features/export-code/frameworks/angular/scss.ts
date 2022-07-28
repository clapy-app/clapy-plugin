import type { ExtraConfig } from '../../../sb-serialize-preview/sb-serialize.model.js';
import type { CodeDict } from '../../code.model.js';

export function patchSCSSInFileContents(resources: CodeDict, extraConfig: ExtraConfig) {
  const angularJson = JSON.parse(resources['angular.json']);
  const proj = angularJson.projects[Object.keys(angularJson.projects)[0]];
  if (extraConfig.scss && extraConfig.useZipProjectTemplate) {
    proj.schematics = {
      '@schematics/angular:component': {
        style: 'scss',
      },
    };
    proj.architect.build.options.inlineStyleLanguage = 'scss';
    proj.architect.test.options.inlineStyleLanguage = 'scss';
  }

  proj.architect.build.options.styles.push('src/resets.css');
  proj.architect.test.options.styles.push('src/resets.css');

  resources['angular.json'] = JSON.stringify(angularJson, null, 2);
}
