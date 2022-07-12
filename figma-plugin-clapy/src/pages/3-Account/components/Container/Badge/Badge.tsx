import { FC, memo } from 'react';

import { _BadgeBase } from '../_BadgeBase/_BadgeBase';

interface Props {
  className?: string;
}
export const Badge: FC<Props> = memo(function Badge(props = {}) {
  return (
    <div>
      <_BadgeBase />
    </div>
  );
});
