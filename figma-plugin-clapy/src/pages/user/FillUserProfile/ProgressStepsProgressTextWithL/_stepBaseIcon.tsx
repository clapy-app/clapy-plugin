import type { SVGProps } from 'react';
import { memo } from 'react';

const _stepBaseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 162 4' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <rect width={162} height={4} fill='#155EEF' />
  </svg>
);

const Memo = memo(_stepBaseIcon);
export { Memo as _stepBaseIcon };
