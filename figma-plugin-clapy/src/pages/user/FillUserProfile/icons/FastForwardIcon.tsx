import { memo, SVGProps } from 'react';

const FastForwardIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M10.8332 15.8332L18.3332 9.99984L10.8332 4.1665V15.8332Z'
      stroke='currentColor'
      strokeWidth={1.66667}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M1.6665 15.8332L9.1665 9.99984L1.6665 4.1665V15.8332Z'
      stroke='currentColor'
      strokeWidth={1.66667}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(FastForwardIcon);
export { Memo as FastForwardIcon };
