import type { ComponentNode2, Dict, ExportCodePayload } from '../../sb-serialize-preview/sb-serialize.model.js';
import { UserSettingsTarget } from '../../sb-serialize-preview/sb-serialize.model.js';
import type { InstanceNode2 } from '../create-ts-compiler/canvas-utils.js';
import { fillWithComponent, fillWithDefaults } from './default-node.js';

export function prepareConfig({ root, components, extraConfig }: ExportCodePayload) {
  if (!extraConfig.target) {
    extraConfig.target = extraConfig.zip ? UserSettingsTarget.zip : UserSettingsTarget.csb;
  }
  if (!extraConfig.framework) {
    extraConfig.framework = 'react';
  }
  if (extraConfig.framework === 'angular' && !extraConfig.angularPrefix) {
    extraConfig.angularPrefix = 'cl';
  }

  const instancesInComp: InstanceNode2[] = [];
  for (const comp of components) {
    fillWithDefaults((comp as any)?.parent, instancesInComp, true);
    fillWithDefaults(comp, instancesInComp);
  }
  const compNodes = components.reduce((prev, cur) => {
    prev[cur.id] = cur;
    return prev;
  }, {} as Dict<ComponentNode2>) as unknown as Dict<ComponentNode2>;
  fillWithDefaults((root as any)?.parent, instancesInComp, true);
  for (const instance of instancesInComp) {
    fillWithComponent(instance, compNodes);
  }
  fillWithComponent(root, compNodes);
  // ------
  return compNodes;
}
