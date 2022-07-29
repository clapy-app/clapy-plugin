import { memo } from 'react';

import clapyLogoIcon from './clapyLogo.png';

interface Props {
  className?: string;
}
const ClapyLogo2Icon = (props: Props) => (
  <img className={`${props.className || ''} `} width={106} src={clapyLogoIcon} referrerPolicy='no-referrer' />
);

const Memo = memo(ClapyLogo2Icon);
export { Memo as ClapyLogo2Icon };
