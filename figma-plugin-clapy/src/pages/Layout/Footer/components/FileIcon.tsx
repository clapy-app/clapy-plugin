import type { SVGProps } from 'react';
import { memo } from 'react';

const FileIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 14 17' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M8.07292 1.39583H3.1875C2.8173 1.39583 2.46227 1.54289 2.2005 1.80466C1.93873 2.06643 1.79167 2.42147 1.79167 2.79167V13.9583C1.79167 14.3285 1.93873 14.6836 2.2005 14.9453C2.46227 15.2071 2.8173 15.3542 3.1875 15.3542H11.5625C11.9327 15.3542 12.2877 15.2071 12.5495 14.9453C12.8113 14.6836 12.9583 14.3285 12.9583 13.9583V6.28125M8.07292 1.39583L12.9583 6.28125M8.07292 1.39583V6.28125H12.9583'
      stroke='white'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(FileIcon);
export { Memo as FileIcon };
