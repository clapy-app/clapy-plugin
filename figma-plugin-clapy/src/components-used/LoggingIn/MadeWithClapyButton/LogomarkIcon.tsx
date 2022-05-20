import { memo, SVGProps } from 'react';

const LogomarkIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 18 19' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <g filter='url(#filter0_dd_794_118569)'>
      <path
        d='M1.5293 4.78814C1.5293 3.66803 1.5293 3.10798 1.74728 2.68015C1.93903 2.30383 2.24499 1.99787 2.62132 1.80612C3.04914 1.58813 3.60919 1.58813 4.7293 1.58813H13.1528C14.2729 1.58813 14.833 1.58813 15.2608 1.80612C15.6371 1.99787 15.9431 2.30383 16.1348 2.68015C16.3528 3.10798 16.3528 3.66803 16.3528 4.78813V13.2117C16.3528 14.3318 16.3528 14.8918 16.1348 15.3196C15.9431 15.696 15.6371 16.0019 15.2608 16.1937C14.833 16.4117 14.2729 16.4117 13.1528 16.4117H4.7293C3.60919 16.4117 3.04914 16.4117 2.62132 16.1937C2.24499 16.0019 1.93903 15.696 1.74728 15.3196C1.5293 14.8918 1.5293 14.3318 1.5293 13.2117V4.78814Z'
        fill='url(#paint0_linear_794_118569)'
      />
      <path
        d='M9.86427 13.0515C9.28083 13.0515 8.72953 12.9475 8.21037 12.7396C7.69615 12.5316 7.24127 12.2419 6.84572 11.8705C6.45017 11.4991 6.13867 11.0708 5.91123 10.5855C5.68379 10.0952 5.57007 9.5728 5.57007 9.01818C5.57007 8.48832 5.67637 7.98323 5.88898 7.50289C6.10653 7.0176 6.40814 6.5843 6.7938 6.203C7.17947 5.8217 7.63188 5.52211 8.15104 5.30423C8.6702 5.08139 9.23633 4.96997 9.84944 4.96997C10.3389 4.96997 10.8086 5.0393 11.2586 5.17795C11.7135 5.31165 12.0719 5.48002 12.334 5.68305L11.4366 7.51032C11.13 7.29243 10.7444 7.18349 10.2796 7.18349C9.86921 7.18349 9.52558 7.2751 9.24869 7.45832C8.97181 7.64154 8.76414 7.87428 8.6257 8.15654C8.4922 8.43881 8.42545 8.72354 8.42545 9.01075C8.42545 9.34253 8.50209 9.64708 8.65537 9.92439C8.80864 10.2017 9.02619 10.4245 9.30802 10.5929C9.58986 10.7563 9.91866 10.838 10.2944 10.838C10.5318 10.838 10.7493 10.8083 10.9471 10.7489C11.1449 10.6845 11.308 10.6053 11.4366 10.5112L12.334 12.3385C12.067 12.5365 11.711 12.7049 11.266 12.8436C10.821 12.9822 10.3538 13.0515 9.86427 13.0515Z'
        fill='url(#paint1_linear_794_118569)'
      />
    </g>
    <defs>
      <filter
        id='filter0_dd_794_118569'
        x={0.139591}
        y={0.661664}
        width={17.6029}
        height={17.6029}
        filterUnits='userSpaceOnUse'
        colorInterpolationFilters='sRGB'
      >
        <feFlood floodOpacity={0} result='BackgroundImageFix' />
        <feColorMatrix
          in='SourceAlpha'
          type='matrix'
          values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0'
          result='hardAlpha'
        />
        <feOffset dy={0.463235} />
        <feGaussianBlur stdDeviation={0.463235} />
        <feColorMatrix type='matrix' values='0 0 0 0 0.0627451 0 0 0 0 0.0941176 0 0 0 0 0.156863 0 0 0 0.06 0' />
        <feBlend mode='normal' in2='BackgroundImageFix' result='effect1_dropShadow_794_118569' />
        <feColorMatrix
          in='SourceAlpha'
          type='matrix'
          values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0'
          result='hardAlpha'
        />
        <feOffset dy={0.463235} />
        <feGaussianBlur stdDeviation={0.694853} />
        <feColorMatrix type='matrix' values='0 0 0 0 0.0627451 0 0 0 0 0.0941176 0 0 0 0 0.156863 0 0 0 0.1 0' />
        <feBlend mode='normal' in2='effect1_dropShadow_794_118569' result='effect2_dropShadow_794_118569' />
        <feBlend mode='normal' in='SourceGraphic' in2='effect2_dropShadow_794_118569' result='shape' />
      </filter>
      <linearGradient
        id='paint0_linear_794_118569'
        x1={8.94106}
        y1={1.58813}
        x2={8.94106}
        y2={16.4117}
        gradientUnits='userSpaceOnUse'
      >
        <stop stopColor='#F5F8FF' />
        <stop offset={1} stopColor='#D2E1FF' />
      </linearGradient>
      <linearGradient
        id='paint1_linear_794_118569'
        x1={8.95203}
        y1={4.96997}
        x2={8.95203}
        y2={13.0515}
        gradientUnits='userSpaceOnUse'
      >
        <stop stopColor='#1E51B2' />
        <stop offset={1} stopColor='#0D347C' />
      </linearGradient>
    </defs>
  </svg>
);

const Memo = memo(LogomarkIcon);
export { Memo as LogomarkIcon };
