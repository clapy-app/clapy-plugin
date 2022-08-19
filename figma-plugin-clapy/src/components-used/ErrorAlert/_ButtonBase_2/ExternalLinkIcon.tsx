import type { SVGProps } from 'react';
import { memo } from 'react';

const ExternalLinkIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M14 9.83333V14.8333C14 15.2754 13.8244 15.6993 13.5118 16.0118C13.1993 16.3244 12.7754 16.5 12.3333 16.5H3.16667C2.72464 16.5 2.30072 16.3244 1.98816 16.0118C1.67559 15.6993 1.5 15.2754 1.5 14.8333V5.66667C1.5 5.22464 1.67559 4.80072 1.98816 4.48816C2.30072 4.17559 2.72464 4 3.16667 4H8.16667M11.5 1.5H16.5M16.5 1.5V6.5M16.5 1.5L7.33333 10.6667'
      stroke='#004EEB'
      strokeWidth={1.67}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(ExternalLinkIcon);
export { Memo as ExternalLinkIcon };
