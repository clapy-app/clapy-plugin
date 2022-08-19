import type { SVGProps } from 'react';
import { memo } from 'react';

const CheckCircleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M18.3333 9.23333V10C18.3323 11.797 17.7504 13.5456 16.6744 14.9849C15.5985 16.4241 14.0861 17.4771 12.3628 17.9866C10.6395 18.4961 8.79771 18.4349 7.11205 17.8122C5.4264 17.1894 3.98721 16.0384 3.00913 14.5309C2.03105 13.0234 1.56649 11.2401 1.68473 9.44693C1.80296 7.6538 2.49767 5.94694 3.66523 4.58089C4.83279 3.21485 6.41065 2.26282 8.16349 1.86679C9.91632 1.47076 11.7502 1.65195 13.3917 2.38333M18.3333 3.33333L10 11.675L7.5 9.175'
      stroke='#004EEB'
      strokeWidth={1.67}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(CheckCircleIcon);
export { Memo as CheckCircleIcon };
