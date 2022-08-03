import { memo, SVGProps } from 'react';

const _3LayersIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 22 22' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M1 16L11 21L21 16M1 11L11 16L21 11M11 1L1 6L11 11L21 6L11 1Z'
      stroke='#101828'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(_3LayersIcon);
export { Memo as _3LayersIcon };
