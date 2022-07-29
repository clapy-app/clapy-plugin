import { memo } from 'react';
import type { FC } from 'react';

import { ClapyIcon2 } from './ClapyIcon2';
import { DiscordFill } from './DiscordFill/DiscordFill';
import { DiscordLogoSvgIcon } from './DiscordLogoSvgIcon';
import { File } from './File/File';
import { FileIcon } from './FileIcon';
import { Footer_styleLinearColorBlueVer } from './Footer_styleLinearColorBlueVer/Footer_styleLinearColorBlueVer';
import classes from './FooterInner.module.css';

interface Props {
  className?: string;
}
export const FooterInner: FC<Props> = memo(function Footer(props = {}) {
  return (
    <div className={classes.root}>
      <Footer_styleLinearColorBlueVer
        className={classes.footer}
        swap={{
          clapy: <ClapyIcon2 className={classes.icon3} />,
          lifeBuoy: (
            <File
              className={classes.file}
              swap={{
                icon: <FileIcon className={classes.icon4} />,
              }}
            />
          ),
          zap: (
            <DiscordFill
              className={classes.discordFill}
              swap={{
                discordLogoSvg: <DiscordLogoSvgIcon className={classes.icon5} />,
              }}
            />
          ),
        }}
        text={{
          contactUsLink: <div className={classes.contactUsLink}>Docs</div>,
          contactUsLink2: <div className={classes.contactUsLink2}>Chat on Discord</div>,
        }}
      />
    </div>
  );
});
