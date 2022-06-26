import type { Dict3, NodeWithDefaults } from '../../../common/sb-serialize.model';
import { extractionBlacklist, nodeDefaults } from '../../../common/sb-serialize.model';

// Extracted from Figma typings
type StyledTextSegment2 = Omit<StyledTextSegment, 'characters' | 'start' | 'end'>;
type RangeProp = keyof StyledTextSegment2;

export const rangeProps: RangeProp[] = [
  'fillStyleId',
  'fills',
  'fontName',
  'fontSize',
  'hyperlink',
  'indentation',
  'letterSpacing',
  'lineHeight',
  'listOptions',
  'textCase',
  'textDecoration',
  'textStyleId',
];
/* as Writeable<typeof rangeProps> */
const extractionBlacklist2 = [...extractionBlacklist, 'selection'];
const blacklist = new Set<string>(extractionBlacklist2);
const textBlacklist = new Set<string>([...extractionBlacklist2, ...rangeProps, 'characters']);

// We prepare the list of fields we want to extract from Figma.
// It is derived from the default values configured in sb-serialize.model.
export const nodeAttributes = {} as Dict3<NodeWithDefaults['type'], Set<string>>;
for (const [nodeType, defaultValues] of Object.entries(nodeDefaults)) {
  const key = nodeType as NodeWithDefaults['type'];
  const bl = key === 'TEXT' ? textBlacklist : blacklist;

  const attrs = new Set(Object.keys(defaultValues).filter(attr => !bl.has(attr)));

  nodeAttributes[key] = attrs;
}
