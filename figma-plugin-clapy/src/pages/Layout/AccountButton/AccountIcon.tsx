import type { SVGProps } from 'react';
import { memo } from 'react';

const AccountIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 15 15' xmlns='http://www.w3.org/2000/svg' fill='current-color' {...props}>
    <path
      d='M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'
      stroke='#667085'
      strokeWidth={1}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(AccountIcon);
export { Memo as AccountIcon };
