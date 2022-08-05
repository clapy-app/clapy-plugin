import type { FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';

import { selectIsFreeUser } from '../../../../user/user-slice.js';
import classes from './BadgePlan.module.css';
import { BookmarkIcon } from './BookmarkIcon.js';

interface Props {
  className?: string;
  classes?: {
    text?: string;
  };
}
export const BadgePlan: FC<Props> = memo(function BadgePlan(props: Props) {
  const isFreeUser = useSelector(selectIsFreeUser);

  const bgColor = isFreeUser ? classes.free : classes.pro;

  return (
    <div className={`${classes.root} ${bgColor} ${props.className || ''}`}>
      <div className={`${classes.text} ${props.classes?.text || ''}`}>
        {isFreeUser ? (
          'Free'
        ) : (
          <>
            <BookmarkIcon />
            &nbsp; Professional plan
          </>
        )}
      </div>
    </div>
  );
});
