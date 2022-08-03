import type { SVGProps } from 'react';
import { memo } from 'react';

const CircleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 22 22' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M11 21C16.5228 21 21 16.5228 21 11C21 5.47715 16.5228 1 11 1C5.47715 1 1 5.47715 1 11C1 16.5228 5.47715 21 11 21Z'
      stroke='#101828'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(CircleIcon);
export { Memo as CircleIcon };
