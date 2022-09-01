import type { SVGProps } from 'react';
import { memo } from 'react';

const ZapIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 18 20' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M9.83333 1.66667L1.5 11.6667H9L8.16667 18.3333L16.5 8.33333H9L9.83333 1.66667Z'
      stroke='#155EEF'
      strokeWidth={1.66667}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(ZapIcon);
export { Memo as ZapIcon };
