import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import classes from './DiscordFill.module.css';
import { DiscordLogoSvgIcon } from './DiscordLogoSvgIcon';

interface Props {
  className?: string;
  classes?: {
    root?: string;
  };
  swap?: {
    discordLogoSvg?: ReactNode;
  };
}
/* @figmaId 1446:123514 */
export const DiscordFill: FC<Props> = memo(function DiscordFill(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={classes.discordLogoSvg}>
        {props.swap?.discordLogoSvg || <DiscordLogoSvgIcon className={classes.icon} />}
      </div>
    </div>
  );
});
