import type { Dict3, NodeWithDefaults } from '../../../common/sb-serialize.model';
import { nodeDefaults } from '../../../common/sb-serialize.model';

// We prepare the list of fields we want to extract from Figma.
// It is derived from the default values configured in sb-serialize.model.
export const nodeAttributes = {} as Dict3<NodeWithDefaults['type'], string[]>;
for (const [nodeType, defaultValues] of Object.entries(nodeDefaults)) {
  const key = nodeType as NodeWithDefaults['type'];
  const attrs = Object.keys(defaultValues);

  // Remove componentPropertyDefinitions from the list of attributes to copy in the generic loop.
  // It will be processed separately since there is a specific logic: throwing an error if the component is a variant.
  const index = attrs.indexOf('componentPropertyDefinitions');
  if (index > -1) {
    attrs.splice(index, 1);
  }

  nodeAttributes[key] = attrs;
}
