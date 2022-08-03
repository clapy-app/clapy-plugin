import { memo, SVGProps } from 'react';

const ArrowLeftIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path d='M15 8H1M1 8L8 15M1 8L8 1' stroke='#101828' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round' />
  </svg>
);

const Memo = memo(ArrowLeftIcon);
export { Memo as ArrowLeftIcon };
