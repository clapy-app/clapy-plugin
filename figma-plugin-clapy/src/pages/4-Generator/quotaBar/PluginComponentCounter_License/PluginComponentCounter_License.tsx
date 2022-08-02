import { memo } from 'react';
import type { FC } from 'react';

import { ArrowRight } from '../ArrowRight/ArrowRight';
import { Badge_SizeSmIconFalseColorGray } from '../Badge_SizeSmIconFalseColorGray/Badge_SizeSmIconFalseColorGray';
import { Button_SizeSmHierarchyLinkColo2 } from '../Button_SizeSmHierarchyLinkColo2/Button_SizeSmHierarchyLinkColo2';
import { Button_SizeSmHierarchyLinkColo } from '../Button_SizeSmHierarchyLinkColo/Button_SizeSmHierarchyLinkColo';
import { HelpIcon_OpenFalseSupportingTe } from '../HelpIcon_OpenFalseSupportingTe/HelpIcon_OpenFalseSupportingTe';
import { List } from '../List/List';
import { ProgressBar_ProgressLabelFalse } from '../ProgressBar_ProgressLabelFalse/ProgressBar_ProgressLabelFalse';
import { ArrowRightIcon } from './ArrowRightIcon';
import { ListIcon } from './ListIcon';
import classes from './PluginComponentCounter_License.module.css';

interface Props {
  className?: string;
}
/* @figmaId 2072:146191 */
export const PluginComponentCounter_License: FC<Props> = memo(function PluginComponentCounter_License(props = {}) {
  return (
    <div className={classes.root}>
      <div className={classes.counterActions}>
        <div className={classes.counter}>
          <Badge_SizeSmIconFalseColorGray
            text={{
              text: <div className={classes.free}>Free</div>,
            }}
          />
          <div className={classes._3Exports}>0/3 exports</div>
          <List
            className={classes.list}
            swap={{
              icon: <ListIcon className={classes.icon} />,
            }}
          />
          <HelpIcon_OpenFalseSupportingTe />
        </div>
        <div className={classes.actions}>
          <Button_SizeSmHierarchyLinkColo
            text={{
              text: <div className={classes.getCredits}>Get credits</div>,
            }}
          />
          <div className={classes.frame168}>|</div>
          <Button_SizeSmHierarchyLinkColo2
            swap={{
              circle: (
                <ArrowRight
                  className={classes.arrowRight}
                  swap={{
                    icon: <ArrowRightIcon className={classes.icon2} />,
                  }}
                />
              ),
            }}
            text={{
              text: <div className={classes.text}>Go pro</div>,
            }}
          />
        </div>
      </div>
      <ProgressBar_ProgressLabelFalse classes={{ progress: classes.progress }} />
    </div>
  );
});
