import type { SVGProps } from 'react';
import { memo } from 'react';

const CodeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 12 12' width={18} height={18} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='m8 9 3-3-3-3M4 3 1 6l3 3'
      stroke='currentColor'
      strokeWidth={1}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(CodeIcon);
export { Memo as CodeIcon };
