import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { showPricing } from '../../../3-Account/stripe-slice.js';
import { dispatchOther } from '../../../../core/redux/redux.utils.js';
import { useCallbackAsync2 } from '../../../../front-utils/front-utils.js';
import { _ButtonBase_SizeSmIconTrailing } from '../_ButtonBase_SizeSmIconTrailing/_ButtonBase_SizeSmIconTrailing';
import classes from './Button_SizeSmHierarchyLinkColo2.module.css';

interface Props {
  className?: string;
  swap?: {
    circle?: ReactNode;
  };
  text?: {
    text?: ReactNode;
  };
}
/* @figmaId 1899:114529 */
export const Button_SizeSmHierarchyLinkColo2: FC<Props> = memo(function Button_SizeSmHierarchyLinkColo2(props = {}) {
  const showPricingPage = useCallbackAsync2(async () => {
    dispatchOther(showPricing());
  }, []);
  return (
    <button onClick={showPricingPage}>
      <_ButtonBase_SizeSmIconTrailing
        className={classes._ButtonBase}
        classes={{ circle: classes.circle }}
        swap={{
          circle: props.swap?.circle,
        }}
        text={{
          text: props.text?.text || <div className={classes.text}>Button CTA</div>,
        }}
      />
    </button>
  );
});
