import { memo, SVGProps } from 'react';

const DiscordLogoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 24 48' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M20.956 17.5215C20.6061 16.993 20.1107 16.5887 19.5233 16.3537C18.2479 15.8423 17.151 15.5007 16.1697 15.3082C15.4812 15.1736 14.7995 15.5121 14.4719 16.1498L14.3901 16.3092C13.6634 16.229 12.8916 16.2021 12.0127 16.2243C11.1116 16.2026 10.3372 16.229 9.60946 16.3092L9.52819 16.1498C9.20055 15.5121 8.51782 15.1741 7.83095 15.3087C6.84956 15.5007 5.75222 15.8423 4.47735 16.3543C3.89038 16.5892 3.39503 16.993 3.0446 17.522C0.600964 21.2131 -0.356615 25.1945 0.117516 29.6946C0.134079 29.8525 0.222073 29.9938 0.356134 30.0782C2.2361 31.2635 3.86295 32.0751 5.47582 32.6331C6.15027 32.8686 6.89821 32.6052 7.29626 31.997L8.0059 30.9095C7.44067 30.6962 6.8889 30.4436 6.3599 30.1418C6.11196 30.0005 6.02552 29.6843 6.16683 29.4363C6.30814 29.1874 6.6244 29.0999 6.87285 29.2433C8.4469 30.1408 10.2265 30.6155 12.0189 30.6155C13.8114 30.6155 15.591 30.1408 17.165 29.2433C17.413 29.0999 17.7292 29.1874 17.871 29.4363C18.0123 29.6843 17.9259 30.0005 17.678 30.1418C17.1314 30.454 16.5599 30.7138 15.9745 30.9307L16.7049 32.0187C17.0056 32.4664 17.502 32.7211 18.0134 32.7211C18.1801 32.7211 18.3483 32.6937 18.5118 32.6378C20.1294 32.0793 21.7593 31.2666 23.6434 30.0787C23.7775 29.9943 23.8655 29.8525 23.8821 29.6951C24.3572 25.1945 23.3996 21.2125 20.956 17.5215ZM8.69381 26.4932C7.69689 26.4932 6.87647 25.443 6.87647 24.1665C6.87647 22.8901 7.69689 21.8399 8.69381 21.8399C9.69072 21.8399 10.5111 22.8901 10.5111 24.1665C10.5111 25.443 9.69072 26.4932 8.69381 26.4932ZM15.4191 26.4798C14.4315 26.4798 13.6189 25.4233 13.6189 24.1391C13.6189 22.8549 14.4315 21.7985 15.4191 21.7985C16.4067 21.7985 17.2194 22.8549 17.2194 24.1391C17.2194 25.4233 16.4067 26.4798 15.4191 26.4798Z'
      fill='white'
    />
  </svg>
);

const Memo = memo(DiscordLogoIcon);
export { Memo as DiscordLogoIcon };