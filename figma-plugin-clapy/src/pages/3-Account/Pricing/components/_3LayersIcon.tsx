import { memo, SVGProps } from 'react';

const _3LayersIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M1.66667 14.1667L10 18.3333L18.3333 14.1667M1.66667 10L10 14.1667L18.3333 10M10 1.66667L1.66667 5.83333L10 10L18.3333 5.83333L10 1.66667Z'
      stroke='#667085'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(_3LayersIcon);
export { Memo as _3LayersIcon };
