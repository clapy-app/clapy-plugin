import type { SVGProps } from 'react';
import { memo } from 'react';

const MailIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M18.3333 5C18.3333 4.08333 17.5833 3.33333 16.6666 3.33333H3.33329C2.41663 3.33333 1.66663 4.08333 1.66663 5M18.3333 5V15C18.3333 15.9167 17.5833 16.6667 16.6666 16.6667H3.33329C2.41663 16.6667 1.66663 15.9167 1.66663 15V5M18.3333 5L9.99996 10.8333L1.66663 5'
      stroke='#B42318'
      strokeWidth={1.67}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(MailIcon);
export { Memo as MailIcon };
