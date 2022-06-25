import { transform } from '@svgr/core';
import _ from 'lodash';

import { ProjectContext } from './code.model';

const svgPrefix = {};
svgPrefix.toString = () => `${_.uniqueId()}_`;

export async function writeSVGReactComponents(projectContext: ProjectContext) {
  for (const [path, { svgPathVarName, svgContent }] of Object.entries(projectContext.svgToWrite)) {
    const svgTsCode = await transform(
      svgContent,
      {
        typescript: true,
        exportType: 'named',
        namedExport: svgPathVarName,
        jsxRuntime: 'automatic',
        dimensions: false,
        memo: true,
        // svgo optimizes the SVG, reducing its size: https://github.com/svg/svgo
        // jsx converts into React component
        plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
        // prettierConfig: await getPrettierConfig(),
        svgoConfig: {
          plugins: [
            {
              name: 'cleanupIDs',
              params: {
                prefix: svgPrefix,
              },
            },
          ],
        },
      },
      { componentName: svgPathVarName },
    );
    // Add SVG as React component. It's the preferred solution over img pointing to SVG file because overflow: visible works as direct SVG and doesn't through img (if the SVG paints content outside the viewbox, which works on Figma).
    projectContext.tsFiles[path] = svgTsCode;
  }
}
