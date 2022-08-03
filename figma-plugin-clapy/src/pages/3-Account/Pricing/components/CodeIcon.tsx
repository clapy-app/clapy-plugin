import { memo, SVGProps } from 'react';

const CodeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 20 12' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M13.3333 11L18.3333 6L13.3333 1M6.66667 1L1.66667 6L6.66667 11'
      stroke='#667085'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(CodeIcon);
export { Memo as CodeIcon };
