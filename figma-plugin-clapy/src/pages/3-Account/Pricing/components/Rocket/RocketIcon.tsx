import { memo, SVGProps } from 'react';

const RocketIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 22 22' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M12.3248 9.67524L4.44059 17.5594M5.29146 11.8375L1.42966 10.9253C1.00478 10.825 0.85535 10.2975 1.16313 9.9886L4.23429 6.91745C4.44059 6.71114 4.7205 6.59294 5.01378 6.59071L8.47636 6.5606M12.8377 2.59843C15.4149 4.35592 17.6441 6.58513 19.4016 9.16227M10.1614 16.7086L11.0736 20.5704C11.1739 20.9952 11.7014 21.1447 12.0103 20.8369L15.0815 17.7657C15.2878 17.5594 15.406 17.2795 15.4082 16.9862L15.4383 13.5237M20.0629 7.35013L20.9639 3.01439C21.2093 1.83455 20.1655 0.790757 18.9856 1.03609L14.6499 1.93714C13.373 2.20255 12.2021 2.83485 11.281 3.75708L7.72362 7.31333C6.36647 8.67048 5.48327 10.4302 5.20447 12.3293L5.19221 12.4107C5.01601 13.6229 5.42193 14.8462 6.2873 15.7127C7.15266 16.5781 8.37711 16.984 9.58929 16.8067L9.67069 16.7944C11.5698 16.5167 13.3295 15.6324 14.6867 14.2753L18.2429 10.719C19.1652 9.79791 19.7975 8.62699 20.0629 7.35013Z'
      stroke='#101828'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(RocketIcon);
export { Memo as RocketIcon };