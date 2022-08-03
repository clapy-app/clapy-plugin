import { memo, SVGProps } from 'react';

const SizeSmColorPrimaryIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 13 11' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      fillRule='evenodd'
      clipRule='evenodd'
      d='M11.0964 0.390037L3.93641 7.30004L2.03641 5.27004C1.68641 4.94004 1.13641 4.92004 0.736406 5.20004C0.346406 5.49004 0.236406 6.00004 0.476406 6.41004L2.72641 10.07C2.94641 10.41 3.32641 10.62 3.75641 10.62C4.16641 10.62 4.55641 10.41 4.77641 10.07C5.13641 9.60004 12.0064 1.41004 12.0064 1.41004C12.9064 0.490037 11.8164 -0.319963 11.0964 0.380037V0.390037Z'
      fill='#2970FF'
    />
  </svg>
);

const Memo = memo(SizeSmColorPrimaryIcon);
export { Memo as SizeSmColorPrimaryIcon };
