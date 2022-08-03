import type { SVGProps } from 'react';
import { memo } from 'react';

const ZapIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 20 22' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M11 1L1 13H10L9 21L19 9H10L11 1Z'
      stroke='#101828'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(ZapIcon);
export { Memo as ZapIcon };
