import type { SVGProps } from 'react';
import { memo } from 'react';

const ArrowRightIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M1.16667 7H12.8333M12.8333 7L7 1.16667M12.8333 7L7 12.8333'
      stroke='#004EEB'
      strokeWidth={1.67}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(ArrowRightIcon);
export { Memo as ArrowRightIcon };
