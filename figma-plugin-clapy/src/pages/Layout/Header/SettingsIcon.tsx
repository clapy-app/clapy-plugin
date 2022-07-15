import type { SVGProps } from 'react';
import { memo } from 'react';

const SettingsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 12 12' width={18} height={18} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <g clipPath='url(#prefix__a)' stroke='currentColor' strokeWidth={1.5} strokeLinecap='round' strokeLinejoin='round'>
      <path d='M6 7.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z' />
      <path d='M9.7 7.5a.825.825 0 0 0 .165.91l.03.03A1.001 1.001 0 1 1 8.48 9.855l-.03-.03a.825.825 0 0 0-.91-.165.825.825 0 0 0-.5.755v.085a1 1 0 1 1-2 0v-.045A.825.825 0 0 0 4.5 9.7a.825.825 0 0 0-.91.165l-.03.03A1.001 1.001 0 1 1 2.145 8.48l.03-.03a.825.825 0 0 0 .165-.91.825.825 0 0 0-.755-.5H1.5a1 1 0 0 1 0-2h.045A.825.825 0 0 0 2.3 4.5a.825.825 0 0 0-.165-.91l-.03-.03A1 1 0 1 1 3.52 2.145l.03.03a.825.825 0 0 0 .91.165h.04a.825.825 0 0 0 .5-.755V1.5a1 1 0 0 1 2 0v.045a.825.825 0 0 0 .5.755.825.825 0 0 0 .91-.165l.03-.03A1 1 0 1 1 9.855 3.52l-.03.03a.825.825 0 0 0-.165.91v.04a.825.825 0 0 0 .755.5h.085a1 1 0 1 1 0 2h-.045a.825.825 0 0 0-.755.5Z' />
    </g>
    <defs>
      <clipPath id='prefix__a'>
        <path fill='currentColor' d='M0 0h12v12H0z' />
      </clipPath>
    </defs>
  </svg>
);

const Memo = memo(SettingsIcon);
export { Memo as SettingsIcon };
