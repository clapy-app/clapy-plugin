import Tooltip from '@mui/material/Tooltip';
import { memo } from 'react';
import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { BadgeQuotas } from '../../../3-Account/components/Container/_BadgeQuotas/BadgeQuotas.js';
import { Badge } from '../../../3-Account/components/Container/Badge/Badge.js';
import { Loading } from '../../../../components-used/Loading/Loading.js';
import { selectIncreasedQuotaUser } from '../../../../core/auth/auth-slice.js';
import { selectIsFreeUser, selectUserMetadata } from '../../../user/user-slice.js';
import { ArrowRight } from '../ArrowRight/ArrowRight';
import { Button_SizeSmHierarchyLinkColo2 } from '../Button_SizeSmHierarchyLinkColo2/Button_SizeSmHierarchyLinkColo2';
import { Button_SizeSmHierarchyLinkColo } from '../Button_SizeSmHierarchyLinkColo/Button_SizeSmHierarchyLinkColo';
import { HelpIcon_OpenFalseSupportingTe } from '../HelpIcon_OpenFalseSupportingTe/HelpIcon_OpenFalseSupportingTe.js';
import { ProgressBar_ProgressLabelFalse } from '../ProgressBar_ProgressLabelFalse/ProgressBar_ProgressLabelFalse';
import { ArrowRightIcon } from './ArrowRightIcon';
import classes from './PluginComponentCounter_License.module.css';

interface Props {
  className?: string;
}
/* @figmaId 2072:146191 */
function showTooltipMessage(isFreeUser: boolean, isQualified: boolean | undefined, nextMonth: string) {
  if (!isFreeUser)
    return (
      <div style={{ textAlign: 'center' }}>
        Your library of custom components
        <br />
        <div>managed by Clapy</div>
      </div>
    );
  if (isQualified)
    return (
      <div style={{ textAlign: 'center' }}>
        Your quota was increased to 10 monthly exports
        <br />
        (next reset on September, 1st).
        <br />
        <br />
        Upgrade now for unlimited access.
      </div>
    );
  return (
    <div style={{ textAlign: 'center' }}>
      Free plan includes 3 monthly exports
      <br />
      (next reset on {nextMonth}, 1st).
      <br />
      <br />
      Get more credits by giving feedback
      <br />
      or upgrade for unlimited access
    </div>
  );
}

function isPro(isFreeUser: boolean, currentDiv: string) {
  switch (currentDiv) {
    case 'counter':
      if (!isFreeUser) return classes.counterPro;
      return null;
      break;
    case 'tooltip':
      if (!isFreeUser) return classes.tooltipPro;
      return null;
      break;
  }
}
export const PluginComponentCounter_License: FC<Props> = memo(function PluginComponentCounter_License(props = {}) {
  const { picture } = useSelector(selectUserMetadata);
  const isFreeUser = useSelector(selectIsFreeUser);
  const isQualifiedUser = useSelector(selectIncreasedQuotaUser);

  let month = new Date().getMonth();
  month === 11 ? (month = 0) : month++;
  var mL = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return (
    <div className={classes.root}>
      <div className={classes.counterActions}>
        <div className={`${classes.counter} ${isPro(isFreeUser, 'counter')}`}>
          {typeof picture !== 'undefined' ? (
            <>
              <Badge />
              <div className={classes.gap}>
                <BadgeQuotas />
                <Tooltip
                  title={showTooltipMessage(isFreeUser, isQualifiedUser, mL[month])}
                  disableInteractive
                  placement='bottom-start'
                  className={isPro(isFreeUser, 'tooltip')}
                >
                  <div>
                    <HelpIcon_OpenFalseSupportingTe />
                  </div>
                </Tooltip>
              </div>
            </>
          ) : (
            <div className={classes.loader}>
              <Loading height={24} width={24} />
            </div>
          )}
          {/* <List
            className={classes.list}
            swap={{
              icon: <ListIcon className={classes.icon} />,
            }}
          /> */}
        </div>
        {isFreeUser && (
          <>
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
          </>
        )}
      </div>
      {isFreeUser && <ProgressBar_ProgressLabelFalse classes={{ progress: classes.progress }} />}
    </div>
  );
});
