import type { SVGProps } from 'react';
import { memo } from 'react';

const Share2Icon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 18 20' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M6.15833 11.2583L11.85 14.575M11.8417 5.425L6.15833 8.74167M16.5 4.16667C16.5 5.54738 15.3807 6.66667 14 6.66667C12.6193 6.66667 11.5 5.54738 11.5 4.16667C11.5 2.78595 12.6193 1.66667 14 1.66667C15.3807 1.66667 16.5 2.78595 16.5 4.16667ZM6.5 10C6.5 11.3807 5.38071 12.5 4 12.5C2.61929 12.5 1.5 11.3807 1.5 10C1.5 8.61929 2.61929 7.5 4 7.5C5.38071 7.5 6.5 8.61929 6.5 10ZM16.5 15.8333C16.5 17.214 15.3807 18.3333 14 18.3333C12.6193 18.3333 11.5 17.214 11.5 15.8333C11.5 14.4526 12.6193 13.3333 14 13.3333C15.3807 13.3333 16.5 14.4526 16.5 15.8333Z'
      stroke='#667085'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(Share2Icon);
export { Memo as Share2Icon };
