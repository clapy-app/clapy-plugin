import type { SVGProps } from 'react';
import { memo } from 'react';

const ArrowLeftIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 21 20' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M16.3334 9.99999H4.66669M4.66669 9.99999L10.5 15.8333M4.66669 9.99999L10.5 4.16666'
      stroke='#004EEB'
      strokeWidth={1.67}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(ArrowLeftIcon);
export { Memo as ArrowLeftIcon };
