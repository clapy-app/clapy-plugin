import { memo, SVGProps } from 'react';

const ListIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 14 10' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M4.33333 1H13M4.33333 5H13M4.33333 9H13M1 1H1.00667M1 5H1.00667M1 9H1.00667'
      stroke='#475467'
      strokeWidth={1.33333}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(ListIcon);
export { Memo as ListIcon };
