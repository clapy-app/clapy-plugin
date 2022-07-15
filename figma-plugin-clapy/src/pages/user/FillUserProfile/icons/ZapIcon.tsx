import type { SVGProps } from 'react';
import { memo } from 'react';

const ZapIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M10.8333 1.6665L2.5 11.6665H10L9.16667 18.3332L17.5 8.33317H10L10.8333 1.6665Z'
      stroke='currentColor'
      strokeWidth={1.66667}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(ZapIcon);
export { Memo as ZapIcon };
