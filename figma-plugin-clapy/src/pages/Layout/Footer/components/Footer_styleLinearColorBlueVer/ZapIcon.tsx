import type { SVGProps } from 'react';
import { memo } from 'react';

const ZapIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 15 17' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M8.07292 1.39583L1.09375 9.77083H7.375L6.67708 15.3542L13.6563 6.97917H7.375L8.07292 1.39583Z'
      stroke='white'
      strokeWidth={1.39583}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(ZapIcon);
export { Memo as ZapIcon };
