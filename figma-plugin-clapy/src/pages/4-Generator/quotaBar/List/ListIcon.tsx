import { memo, SVGProps } from 'react';

const ListIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 20 14' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M6 1H19M6 7H19M6 13H19M1 1H1.01M1 7H1.01M1 13H1.01'
      stroke='#101828'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(ListIcon);
export { Memo as ListIcon };
