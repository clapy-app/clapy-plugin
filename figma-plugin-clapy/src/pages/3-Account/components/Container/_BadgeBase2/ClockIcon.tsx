import type { SVGProps } from 'react';
import { memo } from 'react';

const ClockIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M6 3v3l2 1m3-1A5 5 0 1 1 1 6a5 5 0 0 1 10 0Z'
      stroke='black'
      strokeWidth={1.5}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(ClockIcon);
export { Memo as ClockIcon };
