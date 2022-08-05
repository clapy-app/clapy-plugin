import { memo } from 'react';
import type { FC } from 'react';

import { ClapyIcon } from './ClapyIcon';
import { BadgeMadeWithClapy_modeLightFi } from './components/BadgeMadeWithClapy_modeLightFi/BadgeMadeWithClapy_modeLightFi';
import classes from './MadeWithClapyIcon.module.css';

interface Props {
  className?: string;
}
export const MadeWithClapyIcon: FC<Props> = memo(function MadeWithClapyIcon(props = {}) {
  return (
    <div className={`${classes.root} ${props.className || ''} `}>
      <BadgeMadeWithClapy_modeLightFi
        swap={{
          clapy: <ClapyIcon className={classes.icon} />,
        }}
        text={{
          text: <div className={classes.text}>Made with</div>,
        }}
      />
    </div>
  );
});
