import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { showFeedback } from '../../../3-Account/stripe-slice.js';
import { useAppDispatch } from '../../../../core/redux/hooks.js';
import { useCallbackAsync2 } from '../../../../front-utils/front-utils.js';
import { _ButtonBase_SizeSmIconFalse } from '../_ButtonBase_SizeSmIconFalse/_ButtonBase_SizeSmIconFalse';
import classes from './Button_SizeSmHierarchyLinkColo.module.css';

interface Props {
  className?: string;
  text?: {
    text?: ReactNode;
  };
}
/* @figmaId 1899:114353 */
export const Button_SizeSmHierarchyLinkColo: FC<Props> = memo(function Button_SizeSmHierarchyLinkColo(props = {}) {
  const dispatch = useAppDispatch();
  const showFeedbackPage = useCallbackAsync2(async () => {
    dispatch(showFeedback());
  }, [dispatch]);
  return (
    <button onClick={showFeedbackPage}>
      <_ButtonBase_SizeSmIconFalse
        className={classes._ButtonBase}
        text={{
          text: props.text?.text || <div className={classes.text}>Button CTA</div>,
        }}
      />
    </button>
  );
});
