import type { SVGProps } from 'react';
import { memo } from 'react';

const GithubIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 22 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M8 20C3 21.5 3 17.5 1 17M15 23V19.13C15.0375 18.6532 14.9731 18.1738 14.811 17.7238C14.6489 17.2738 14.3929 16.8634 14.06 16.52C17.2 16.17 20.5 14.98 20.5 9.52C20.4997 8.12383 19.9627 6.7812 19 5.77C19.4559 4.54851 19.4236 3.19835 18.91 2C18.91 2 17.73 1.65 15 3.48C12.708 2.85882 10.292 2.85882 8 3.48C5.27 1.65 4.09 2 4.09 2C3.57638 3.19835 3.54414 4.54851 4 5.77C3.03013 6.7887 2.49252 8.14346 2.5 9.55C2.5 14.97 5.8 16.16 8.94 16.55C8.611 16.89 8.35726 17.2954 8.19531 17.7399C8.03335 18.1844 7.96681 18.6581 8 19.13V23'
      stroke='#101828'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(GithubIcon);
export { Memo as GithubIcon };
