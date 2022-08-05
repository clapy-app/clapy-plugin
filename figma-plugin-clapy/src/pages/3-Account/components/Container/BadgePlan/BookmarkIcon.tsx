import type { SVGProps } from 'react';
import { memo } from 'react';

const bookmark = (props: SVGProps<SVGSVGElement>) => (
  <svg width='12' height='13' viewBox='0 0 12 13' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <g clipPath='url(#clip0_2258_104563)'>
      <path
        d='M9.5 11.478L6 8.97803L2.5 11.478V3.47803C2.5 3.21281 2.60536 2.95846 2.79289 2.77092C2.98043 2.58338 3.23478 2.47803 3.5 2.47803H8.5C8.76522 2.47803 9.01957 2.58338 9.20711 2.77092C9.39464 2.95846 9.5 3.21281 9.5 3.47803V11.478Z'
        stroke='#2970FF'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </g>
    <defs>
      <clipPath id='clip0_2258_104563'>
        <rect width='12' height='12' fill='white' transform='translate(0 0.978027)' />
      </clipPath>
    </defs>
  </svg>
);

const Memo = memo(bookmark);
export { Memo as BookmarkIcon };
