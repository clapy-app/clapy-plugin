import { memo, SVGProps } from 'react';

const ChevronDownIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 20 21' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M5 7.83325L10 12.8333L15 7.83325'
      stroke='#667085'
      strokeWidth={1.66667}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(ChevronDownIcon);
export { Memo as ChevronDownIcon };
