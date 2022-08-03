import type { SVGProps } from 'react';
import { memo } from 'react';

const MessageCircleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M19 9.5C19.0034 10.8199 18.6951 12.1219 18.1 13.3C17.3944 14.7117 16.3098 15.8992 14.9674 16.7293C13.6251 17.5594 12.0782 17.9994 10.5 18C9.18013 18.0034 7.87812 17.6951 6.7 17.1L1 19L2.9 13.3C2.30493 12.1219 1.99656 10.8199 2 9.5C2.00061 7.92176 2.44061 6.37485 3.27072 5.03255C4.10083 3.69025 5.28825 2.60557 6.7 1.9C7.87812 1.30493 9.18013 0.996559 10.5 1H11C13.0843 1.11499 15.053 1.99476 16.5291 3.47086C18.0052 4.94696 18.885 6.91565 19 9V9.5Z'
      stroke='white'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(MessageCircleIcon);
export { Memo as MessageCircleIcon };
