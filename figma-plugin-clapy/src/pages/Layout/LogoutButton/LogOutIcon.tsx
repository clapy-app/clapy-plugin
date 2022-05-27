import { memo, SVGProps } from 'react';

const LogOutIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 22 22' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M8.34375 18.9687H4.80208C4.33243 18.9687 3.88201 18.7822 3.54991 18.4501C3.21782 18.118 3.03125 17.6676 3.03125 17.1979V4.80208C3.03125 4.33243 3.21782 3.88201 3.54991 3.54991C3.88201 3.21782 4.33243 3.03125 4.80208 3.03125H8.34375M14.5417 15.4271L18.9687 11M18.9687 11L14.5417 6.57292M18.9687 11H8.34375'
      stroke='#667085'
      strokeWidth={1.77437}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(LogOutIcon);
export { Memo as LogOutIcon };
