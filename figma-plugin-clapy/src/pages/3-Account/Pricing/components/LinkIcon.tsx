import { memo, SVGProps } from 'react';

const LinkIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M8.33333 10.8333C8.69121 11.3118 9.1478 11.7077 9.67212 11.9941C10.1965 12.2806 10.7763 12.4509 11.3722 12.4936C11.9682 12.5363 12.5663 12.4503 13.1261 12.2415C13.6859 12.0327 14.1943 11.7059 14.6167 11.2833L17.1167 8.78333C17.8757 7.99749 18.2956 6.94498 18.2861 5.85249C18.2766 4.76001 17.8384 3.71496 17.0659 2.94242C16.2934 2.16989 15.2483 1.73168 14.1558 1.72219C13.0634 1.7127 12.0108 2.13267 11.225 2.89167L9.79167 4.31667M11.6667 9.16667C11.3088 8.68823 10.8522 8.29235 10.3279 8.00588C9.80355 7.71942 9.22374 7.54907 8.62779 7.50639C8.03184 7.46371 7.43368 7.54969 6.87388 7.75851C6.31408 7.96734 5.80574 8.29411 5.38333 8.71667L2.88333 11.2167C2.12434 12.0025 1.70436 13.055 1.71386 14.1475C1.72335 15.24 2.16156 16.285 2.93409 17.0576C3.70662 17.8301 4.75167 18.2683 5.84416 18.2778C6.93665 18.2873 7.98916 17.8673 8.775 17.1083L10.2 15.6833'
      stroke='#667085'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(LinkIcon);
export { Memo as LinkIcon };