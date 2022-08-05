import type { SVGProps } from 'react';
import { memo } from 'react';

const CheckCircleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width='20' height='21' viewBox='0 0 20 21' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <g clipPath='url(#clip0_2258_112099)'>
      <path
        d='M18.3337 10.2116V10.9782C18.3326 12.7753 17.7507 14.5238 16.6748 15.9631C15.5988 17.4024 14.0864 18.4553 12.3631 18.9648C10.6399 19.4743 8.79804 19.4132 7.11238 18.7904C5.42673 18.1676 3.98754 17.0167 3.00946 15.5091C2.03138 14.0016 1.56682 12.2183 1.68506 10.4252C1.80329 8.63204 2.498 6.92518 3.66556 5.55913C4.83312 4.19309 6.41098 3.24106 8.16382 2.84503C9.91665 2.449 11.7505 2.63019 13.392 3.36157M18.3337 4.31157L10.0003 12.6532L7.50033 10.1532'
        stroke='white'
        strokeWidth='1.67'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </g>
    <defs>
      <clipPath id='clip0_2258_112099'>
        <rect width='20' height='20' fill='white' transform='translate(0 0.978027)' />
      </clipPath>
    </defs>
  </svg>
);

const Memo = memo(CheckCircleIcon);
export { Memo as CheckCircleIcon };
