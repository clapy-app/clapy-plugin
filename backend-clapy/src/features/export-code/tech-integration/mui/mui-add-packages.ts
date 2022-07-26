import type { ProjectContext } from '../../code.model.js';

const muiDependencies = {
  '@emotion/react': '^11.9.0',
  '@emotion/styled': '^11.8.1',
  '@mui/icons-material': '^5.6.2',
  '@mui/material': '^5.6.2',
};

export async function addMUIPackages(projectContext: ProjectContext) {
  const { enableMUIFramework, newDependencies } = projectContext;
  if (enableMUIFramework) {
    Object.assign(newDependencies, muiDependencies);
  }
}
