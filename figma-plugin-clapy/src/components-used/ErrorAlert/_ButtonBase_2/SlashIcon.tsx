import { memo, SVGProps } from 'react';

const SlashIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M4.10829 4.10833L15.8916 15.8917M18.3333 10C18.3333 14.6024 14.6023 18.3333 9.99996 18.3333C5.39759 18.3333 1.66663 14.6024 1.66663 10C1.66663 5.39763 5.39759 1.66667 9.99996 1.66667C14.6023 1.66667 18.3333 5.39763 18.3333 10Z'
      stroke='#B42318'
      strokeWidth={1.67}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(SlashIcon);
export { Memo as SlashIcon };
