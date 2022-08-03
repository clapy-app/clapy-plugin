import { memo, SVGProps } from 'react';

const ButtonIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg preserveAspectRatio='none' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      fillRule='evenodd'
      clipRule='evenodd'
      d='M24 48C37.2548 48 48 37.2548 48 24C48 10.7452 37.2548 0 24 0C10.7452 0 0 10.7452 0 24C0 37.2548 10.7452 48 24 48ZM20.25 32.8033L33.75 25.2576C34.75 24.6987 34.75 23.3013 33.75 22.7424L20.25 15.1967C19.25 14.6378 18 15.3365 18 16.4543V31.5457C18 32.6635 19.25 33.3622 20.25 32.8033Z'
      fill='white'
      fillOpacity={0.3}
    />
  </svg>
);

const Memo = memo(ButtonIcon);
export { Memo as ButtonIcon };
