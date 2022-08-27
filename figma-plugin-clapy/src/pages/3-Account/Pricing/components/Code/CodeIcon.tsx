import type { SVGProps } from 'react';
import { memo } from 'react';

const CodeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 22 14' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M15 13L21 7L15 1M7 1L1 7L7 13'
      stroke='#101828'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(CodeIcon);
export { Memo as CodeIcon };
