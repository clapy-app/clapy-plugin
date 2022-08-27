import type { SVGProps } from 'react';
import { memo } from 'react';

const MoreHorizontalIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M10 10.833a.833.833 0 1 0 0-1.666.833.833 0 0 0 0 1.666ZM15.834 10.833a.833.833 0 1 0 0-1.666.833.833 0 0 0 0 1.666ZM4.167 10.833a.833.833 0 1 0 0-1.666.833.833 0 0 0 0 1.666Z'
      stroke='#98A2B3'
      strokeWidth={1.667}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(MoreHorizontalIcon);
export { Memo as MoreHorizontalIcon };
