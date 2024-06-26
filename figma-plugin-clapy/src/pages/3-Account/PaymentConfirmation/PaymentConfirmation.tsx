import { memo } from 'react';
import type { FC } from 'react';

import successLottie from '../../../lotties/gen-code-success.json';
import { ArrowLeft } from './ArrowLeft/ArrowLeft';
import { ArrowLeftIcon } from './ArrowLeftIcon';
import { Button_SizeMdHierarchyLinkGray } from './Button_SizeMdHierarchyLinkGray/Button_SizeMdHierarchyLinkGray';
import classes from './PaymentConfirmation.module.css';
import { LottieWrapper } from '../../../components-used/LottieWrapper/LottieWrapper.js';

interface Props {
  className?: string;
}

/* @figmaId 1688:131981 */
export const PaymentConfirmation: FC<Props> = memo(function PaymentConfirmation(props = {}) {
  return (
    <div className={classes.root}>
      <div className={classes.content}>
        <Button_SizeMdHierarchyLinkGray
          swap={{
            circle: (
              <ArrowLeft
                className={classes.arrowLeft}
                swap={{
                  icon: <ArrowLeftIcon className={classes.icon} />,
                }}
              />
            ),
          }}
          text={{
            text: <div className={classes.text}>Back to settings</div>,
          }}
        />
        <div className={classes.content2}>
          <LottieWrapper animationData={successLottie} width={160} height={160} loop={false} />
          <div className={classes.previewTitleBlock}>
            <div className={classes.thankYouForUpgrading}>Thank you for upgrading!</div>
          </div>
          <div className={classes.previewTitleBlock2}>
            <div className={classes.youNowHaveFullAccessToClapySFe}>
              <p className={classes.text2}>
                <span className={classes.labelWrapper}>
                  You now have <span className={classes.label2}>full access</span> to <br />
                  Clapy’s features, <span className={classes.label4}>priority support,</span> and future updates!
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
