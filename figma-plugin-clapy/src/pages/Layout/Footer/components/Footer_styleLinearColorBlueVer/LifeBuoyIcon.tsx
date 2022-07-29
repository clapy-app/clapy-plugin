import type { SVGProps } from 'react';
import { memo } from 'react';

const LifeBuoyIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 17 17' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M3.44073 3.44073L6.3999 6.3999M10.3501 10.3501L13.3093 13.3093M13.3093 3.44073L10.3501 6.3999L12.8138 3.93625M3.44073 13.3093L6.3999 10.3501M15.3542 8.375C15.3542 12.2295 12.2295 15.3542 8.375 15.3542C4.52051 15.3542 1.39583 12.2295 1.39583 8.375C1.39583 4.52051 4.52051 1.39583 8.375 1.39583C12.2295 1.39583 15.3542 4.52051 15.3542 8.375ZM11.1667 8.375C11.1667 9.9168 9.9168 11.1667 8.375 11.1667C6.83321 11.1667 5.58333 9.9168 5.58333 8.375C5.58333 6.83321 6.83321 5.58333 8.375 5.58333C9.9168 5.58333 11.1667 6.83321 11.1667 8.375Z'
      stroke='white'
      strokeWidth={1.39583}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(LifeBuoyIcon);
export { Memo as LifeBuoyIcon };
