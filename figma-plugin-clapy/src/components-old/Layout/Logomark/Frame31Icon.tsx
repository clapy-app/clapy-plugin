import { memo, SVGProps } from 'react';

const Frame31Icon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <g filter='url(#filter0_dd_225_42060)'>
      <rect
        x={0.529419}
        y={0.588226}
        width={14.8235}
        height={14.8235}
        rx={3.24265}
        fill='url(#paint0_linear_225_42060)'
      />
      <path
        d='M8.86439 12.0518C8.28095 12.0518 7.72965 11.9478 7.21049 11.7398C6.69628 11.5318 6.24139 11.2421 5.84584 10.8707C5.45029 10.4993 5.13879 10.071 4.91135 9.58572C4.68391 9.09547 4.57019 8.57304 4.57019 8.01843C4.57019 7.48857 4.67649 6.98347 4.8891 6.50313C5.10666 6.01784 5.40826 5.58455 5.79393 5.20325C6.17959 4.82195 6.632 4.52236 7.15116 4.30447C7.67032 4.08163 8.23645 3.97021 8.84956 3.97021C9.33905 3.97021 9.80877 4.03954 10.2587 4.1782C10.7136 4.3119 11.0721 4.48026 11.3341 4.68329L10.4367 6.51056C10.1302 6.29268 9.74449 6.18373 9.27972 6.18373C8.86933 6.18373 8.5257 6.27534 8.24881 6.45856C7.97193 6.64179 7.76426 6.87453 7.62582 7.15679C7.49232 7.43905 7.42557 7.72379 7.42557 8.011C7.42557 8.34278 7.50221 8.64732 7.65549 8.92463C7.80876 9.20194 8.02632 9.42478 8.30815 9.59314C8.58998 9.75656 8.91878 9.83827 9.29455 9.83827C9.53188 9.83827 9.74944 9.80855 9.94721 9.74913C10.145 9.68476 10.3082 9.60552 10.4367 9.51144L11.3341 11.3387C11.0671 11.5368 10.7111 11.7051 10.2661 11.8438C9.82113 11.9825 9.35388 12.0518 8.86439 12.0518Z'
        fill='url(#paint1_linear_225_42060)'
      />
    </g>
    <defs>
      <filter
        id='filter0_dd_225_42060'
        x={-0.860287}
        y={-0.338244}
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
        <feBlend mode='normal' in2='BackgroundImageFix' result='effect1_dropShadow_225_42060' />
        <feColorMatrix
          in='SourceAlpha'
          type='matrix'
          values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0'
          result='hardAlpha'
        />
        <feOffset dy={0.463235} />
        <feGaussianBlur stdDeviation={0.694853} />
        <feColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0' />
        <feBlend mode='normal' in2='effect1_dropShadow_225_42060' result='effect2_dropShadow_225_42060' />
        <feBlend mode='normal' in='SourceGraphic' in2='effect2_dropShadow_225_42060' result='shape' />
      </filter>
      <linearGradient
        id='paint0_linear_225_42060'
        x1={7.94118}
        y1={0.588226}
        x2={7.94118}
        y2={15.4118}
        gradientUnits='userSpaceOnUse'
      >
        <stop stopColor='#FCFCFD' />
        <stop offset={1} stopColor='#D1E0FF' />
      </linearGradient>
      <linearGradient
        id='paint1_linear_225_42060'
        x1={7.95215}
        y1={3.97021}
        x2={7.95215}
        y2={12.0518}
        gradientUnits='userSpaceOnUse'
      >
        <stop stopColor='#1E50B0' />
        <stop offset={1} stopColor='#0D347D' />
      </linearGradient>
    </defs>
  </svg>
);

const Memo = memo(Frame31Icon);
export { Memo as Frame31Icon };
