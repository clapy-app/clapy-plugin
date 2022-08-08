import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { useAppDispatch } from '../../../../core/redux/hooks.js';
import { useCallbackAsync2 } from '../../../../front-utils/front-utils.js';
import { hidePaymentConfirmation } from '../../stripe-slice.js';
import { _ButtonBase_SizeMdIconLeading } from '../_ButtonBase_SizeMdIconLeading/_ButtonBase_SizeMdIconLeading';
import classes from './Button_SizeMdHierarchyLinkGray.module.css';
import { CircleIcon } from './CircleIcon';

interface Props {
  className?: string;
  swap?: {
    circle?: ReactNode;
  };
  text?: {
    text?: ReactNode;
  };
}
/* @figmaId 1899:113187 */
export const Button_SizeMdHierarchyLinkGray: FC<Props> = memo(function Button_SizeMdHierarchyLinkGray(props = {}) {
  const dispatch = useAppDispatch();
  const disableConfirmationPage = useCallbackAsync2(async () => {
    dispatch(hidePaymentConfirmation());
  }, [dispatch]);
  return (
    <button onClick={disableConfirmationPage}>
      <_ButtonBase_SizeMdIconLeading
        className={classes._ButtonBase}
        swap={{
          icon: <CircleIcon className={classes.icon} />,
          circle: props.swap?.circle,
        }}
        text={{
          text: props.text?.text || <div className={classes.text}>Button CTA</div>,
        }}
      />
    </button>
  );
});
