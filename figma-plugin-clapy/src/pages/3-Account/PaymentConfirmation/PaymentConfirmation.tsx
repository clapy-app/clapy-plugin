import { memo } from 'react';
import type { FC } from 'react';
import type { Options } from 'react-lottie';
import Lottie from 'react-lottie';

import successLottie from '../../../lotties/gen-code-success.json';
import { ArrowLeft } from './ArrowLeft/ArrowLeft';
import { ArrowLeftIcon } from './ArrowLeftIcon';
import { Button_SizeMdHierarchyLinkGray } from './Button_SizeMdHierarchyLinkGray/Button_SizeMdHierarchyLinkGray';
import classes from './PaymentConfirmation.module.css';

interface Props {
  className?: string;
}

function lottieOptions(animationData: any) {
  const defaultOptions: Options = {
    loop: false,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  };
  return defaultOptions;
}
/* @figmaId 1688:131981 */
export const PaymentConfirmation: FC<Props> = memo(function PaymentConfirmation(props = {}) {
  const successOptions = lottieOptions(successLottie);

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
          <Lottie options={successOptions} height={160} width={160} />
          <div className={classes.previewTitleBlock}>
            <div className={classes.thankYouForUpgrading}>Thank you for upgrading!</div>
          </div>
          <div className={classes.previewTitleBlock2}>
            <div className={classes.youNowHaveFullAccessToClapySFe}>
              <p className={classes.text2}>
                <span className={classes.labelWrapper}>
                  You now have <span className={classes.label2}>full access</span> <br />
                  Clapy’s features and future updates and <span className={classes.label4}>premium support</span> with
                  our team!
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
