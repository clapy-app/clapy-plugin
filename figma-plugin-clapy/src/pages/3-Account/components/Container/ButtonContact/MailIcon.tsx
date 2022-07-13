import type { SVGProps } from 'react';
import { memo } from 'react';

const MailIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 21 21' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M18.833 5.627c0-.917-.75-1.667-1.666-1.667H3.832c-.917 0-1.667.75-1.667 1.667m16.667 0v10c0 .916-.75 1.666-1.666 1.666H3.832c-.917 0-1.667-.75-1.667-1.666v-10m16.667 0L10.5 11.46 2.166 5.627'
      stroke='#004EEB'
      strokeWidth={1.67}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(MailIcon);
export { Memo as MailIcon };
