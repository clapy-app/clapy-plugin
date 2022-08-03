import { memo, SVGProps } from 'react';

const PlusIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 10 10' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path d='M5 1.5V8.5M1.5 5H8.5' stroke='#2970FF' strokeWidth={1.5} strokeLinecap='round' strokeLinejoin='round' />
  </svg>
);

const Memo = memo(PlusIcon);
export { Memo as PlusIcon };
