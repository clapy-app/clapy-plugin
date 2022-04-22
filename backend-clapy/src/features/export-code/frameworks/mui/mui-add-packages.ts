import { env } from '../../../../env-and-config/env';
import { ProjectContext } from '../../code.model';
import { frameworksTemplateDir } from '../../create-ts-compiler/load-file.utils';

export function addMUIPackages(projectContext: ProjectContext) {
  const { enableMUIFramework, resources } = projectContext;
  if (enableMUIFramework) {
    try {
      const packageJson = JSON.parse(resources['package.json']);
      const muiDependencies = require(`${frameworksTemplateDir}/mui/package-dependencies.json`);
      Object.assign(packageJson.dependencies, muiDependencies);
      resources['package.json'] = JSON.stringify(packageJson, null, 2);
      // package.json typings available at
      // https://github.com/sindresorhus/type-fest
      // and/or https://www.npmjs.com/package/package-json-type
    } catch (error) {
      console.warn(
        'Cannot parse and update package.json. Skipping in production, but the generated project is incomplete.',
      );
      if (env.isDev) {
        throw error;
      }
    }
  }
}
