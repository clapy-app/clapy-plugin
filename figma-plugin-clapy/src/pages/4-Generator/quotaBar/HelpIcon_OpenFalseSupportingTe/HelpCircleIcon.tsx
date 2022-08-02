import { memo, SVGProps } from 'react';

const HelpCircleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M6.06 6C6.21674 5.55445 6.5261 5.17874 6.9333 4.93942C7.34051 4.70011 7.81926 4.61263 8.28478 4.69247C8.75031 4.77232 9.17254 5.01435 9.47672 5.37569C9.78089 5.73702 9.94737 6.19435 9.94667 6.66667C9.94667 8 7.94667 8.66667 7.94667 8.66667M8 11.3333H8.00667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z'
      stroke='#98A2B3'
      strokeWidth={1.33333}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(HelpCircleIcon);
export { Memo as HelpCircleIcon };
