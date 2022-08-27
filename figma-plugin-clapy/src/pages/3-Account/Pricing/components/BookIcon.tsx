import type { SVGProps } from 'react';
import { memo } from 'react';

const BookIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 16 20' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M1.33333 16.25C1.33333 15.6975 1.55283 15.1676 1.94353 14.7769C2.33423 14.3862 2.86413 14.1667 3.41667 14.1667H14.6667M1.33333 16.25C1.33333 16.8025 1.55283 17.3324 1.94353 17.7231C2.33423 18.1138 2.86413 18.3333 3.41667 18.3333H14.6667V1.66667H3.41667C2.86413 1.66667 2.33423 1.88616 1.94353 2.27686C1.55283 2.66756 1.33333 3.19747 1.33333 3.75V16.25Z'
      stroke='#667085'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(BookIcon);
export { Memo as BookIcon };
